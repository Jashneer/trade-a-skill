const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const User = require('./models/User');
const Skill = require('./models/Skill');

//Socket+Auth 
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const passport = require('./config/passport');   // ← Member 4
const authRoutes = require('./routes/auth');      // ← Member 4
const JWT_SECRET = process.env.JWT_SECRET || 'tradeaskill_jwt_secret_2025';

const app = express();
   

// Concept 2 Setup for EJS 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Built-in Body-parser

// Application-level middleware to log every request
app.use(logger);
app.use(passport.initialize());  
app.use('/api/auth', authRoutes);  

const dbPath = path.join(__dirname, 'data', 'db.json');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

// Concept 2 - SSR Admin Route [cite: 166, 206]
app.get('/admin', async (req, res) => {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const normalizedUsers = users.map((user) => {
        const normalizedUser = {
            ...user,
            id: String(user._id),
        };
        delete normalizedUser._id;
        return normalizedUser;
    });

    // Renders the admin.ejs file and passes user data
    res.render('admin', { users: normalizedUsers });
});

app.get('/api/features', (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // This sends the error to your errorHandler.js
        const db = JSON.parse(data);
        res.json(db.features || []);
    });
});

app.get('/api/skills', async (req, res) => {
    const skills = await Skill.find({}).sort({ createdAt: -1 }).lean();
    const normalizedSkills = skills.map((skill) => {
        const normalizedSkill = {
            ...skill,
            id: String(skill._id),
        };
        delete normalizedSkill._id;
        return normalizedSkill;
    });

    res.json(normalizedSkills);
});

app.get('/api/users', async (req, res) => {
    const email = (req.query.email || '').toString().toLowerCase().trim();
    const query = email ? { email } : {};
    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    const normalizedUsers = users.map((user) => {
        const normalizedUser = {
            ...user,
            id: String(user._id),
        };
        delete normalizedUser._id;
        return normalizedUser;
    });

    res.json(normalizedUsers);
});

app.post('/api/users', async (req, res) => {
    try {
        const payload = { ...req.body };
        delete payload.id;

        if (!Array.isArray(payload.skillsToTeach)) payload.skillsToTeach = [];
        if (!Array.isArray(payload.skillsToLearn)) payload.skillsToLearn = [];

        const createdUser = await User.create(payload);
        res.status(201).json(createdUser.toJSON());
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        if (error && (error.name === 'ValidationError' || error.name === 'StrictModeError')) {
            return res.status(400).json({ message: error.message });
        }

        throw error;
    }
});



app.patch('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = { ...req.body };
        delete updates.id;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
            context: 'query',
        });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser.toJSON());
    } catch (error) {
        if (error && error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        if (error && (error.name === 'ValidationError' || error.name === 'StrictModeError')) {
            return res.status(400).json({ message: error.message });
        }

        throw error;
    }
});

app.post('/api/activity-log', (req, res, next) => {
    const logPath = path.join(__dirname, 'data', 'activity.txt');
    const logEntry = `Activity: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        res.json({ message: 'Activity logged successfully' });
    });
});

app.get('/api/swap-requests', (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        res.json(db.swapRequests || []);
    });
});

app.post('/api/swap-requests', (req, res, next) => {
    const newRequest = req.body;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        const requestWithId = {
            id: Date.now().toString(),
            ...newRequest,
        };

        db.swapRequests = db.swapRequests || [];
        db.swapRequests.push(requestWithId);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) return next(writeErr); // Passes the writing error to errorHandler.js

            res.status(201).json(requestWithId);
        });
    });
});

app.delete('/api/swap-requests/:id', (req, res, next) => {
    const requestId = req.params.id;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        db.swapRequests = (db.swapRequests || []).filter(
            request => request.id !== requestId
        );

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (writeErr) => {
            if (writeErr) return next(writeErr); // Passes the writing error to errorHandler.js

            res.json({ message: 'Swap request deleted successfully' });
        });
    });
});

// --- Performance Expert - True Streaming ---

app.get('/api/export-history', (req, res, next) => {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    res.setHeader('Content-Disposition', `attachment; filename="TradeReport.${format}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

    const readStream = fs.createReadStream(dbPath);

    readStream.pipe(res);

    readStream.on('error', (err) => {
        console.error("Streaming error:", err);
        if (!res.headersSent) res.status(500).send("Streaming failed");
    });
});

// Swap Reviews
app.get('/api/swap-reviews', (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        res.json(db.swapReviews || []);
    });
});

// ── Socket Status ─────────────────────────────────────────────────────────────
app.get('/api/socket-status', (req, res) => {
    res.json({ status: 'Socket.io running', onlineUsers: onlineUsers.size });
});


// --- Static Serving ---

app.use(express.static(frontendDistPath));

app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Concept 1 - Final Error-handling Middleware
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Online users map: userId → socketId
const onlineUsers = new Map();

// Socket.io JWT middleware
io.use((socket, next) => {
    try {
        const raw = socket.handshake.auth?.token || '';
        const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = String(decoded.id);
            socket.userEmail = decoded.email;
        } else {
            socket.userId = null;
            socket.userEmail = 'guest';
        }
    } catch {
        socket.userId = null;
        socket.userEmail = 'guest';
    }
    next();
});
 
io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id} | ${socket.userEmail}`);
 
    if (socket.userId) {
        onlineUsers.set(socket.userId, socket.id);
        io.emit('online_count', { count: onlineUsers.size });
    }
 
    // Learner sends swap request → notify teacher instantly
    socket.on('swap_request_sent', (data) => {
        const teacherSid = onlineUsers.get(String(data.teacherUserId));
        if (teacherSid) {
            io.to(teacherSid).emit('notification', {
                type: 'NEW_SWAP_REQUEST',
                message: `${data.learnerName} wants to learn "${data.skillRequested}" and offers "${data.skillOffered}"`,
                timestamp: new Date().toISOString(),
            });
        }
        socket.emit('swap_request_ack', { status: 'sent' });
    });
 
    // Teacher updates swap status → notify learner
    socket.on('swap_status_updated', (data) => {
        const learnerSid = onlineUsers.get(String(data.learnerUserId));
        if (learnerSid) {
            io.to(learnerSid).emit('notification', {
                type: 'SWAP_STATUS_UPDATE',
                status: data.status,
                message: data.status === 'APPROVED'
                    ? `🎉 Your swap for "${data.skillTitle}" was APPROVED!`
                    : `Your swap for "${data.skillTitle}" was declined.`,
                timestamp: new Date().toISOString(),
            });
        }
    });
 
    // Real-time chat rooms
    socket.on('join_chat_room', ({ roomId }) => {
        socket.join(roomId);
        socket.to(roomId).emit('chat_event', { type: 'USER_JOINED', userEmail: socket.userEmail });
    });
 
    socket.on('chat_message', ({ roomId, message, senderName }) => {
        socket.to(roomId).emit('chat_message', {
            senderName, message, timestamp: new Date().toISOString(),
        });
    });
 
    socket.on('typing', ({ roomId, senderName }) => {
        socket.to(roomId).emit('typing', { senderName });
    });
 
    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('online_count', { count: onlineUsers.size });
        }
        console.log(`[Socket] Disconnected: ${socket.id}`);
    });
});

const startServer = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log('==========================================');
        console.log(`SERVER RUNNING: http://localhost:${PORT}`);
        console.log('==========================================');
    });
   
};

startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});