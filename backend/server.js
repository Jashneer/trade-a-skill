const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const authVerify = require('./middleware/authVerify');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const swapRoutes = require('./routes/swapRoutes');
require('dotenv').config();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { sessionConfig, attachCurrentUser } = require('./middleware/sessionHandler');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const User = require('./models/User');
const Skill = require('./models/Skill');

const app = express();

// Concept 2 Setup for EJS 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';

app.use(cors({
  origin: ['https://trade-a-skill-r5lu.vercel.app/', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json()); // Built-in Body-parser
app.use(sessionConfig); // Session management middleware
app.use(attachCurrentUser); // Attach current user from session if available

// Application-level middleware to log every request
app.use(logger);

const dbPath = path.join(__dirname, 'data', 'db.json');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or use a different PORT.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

const normalizeRoomId = (value) => {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const jwt = require('jsonwebtoken');
        const User = require('./models/User');
        const secret = process.env.JWT_SECRET || 'trade-a-skill-jwt-secret';
        const payload = jwt.verify(token, secret);
        const user = await User.findById(payload.sub).lean();

        if (!user) {
            return next(new Error('Invalid token'));
        }

        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.firstName || 'Unknown'})`);

    socket.on('join_chat_room', ({ roomId }) => {
        const normalizedRoom = normalizeRoomId(roomId);
        if (!normalizedRoom) {
            console.warn(`Socket ${socket.id} failed to normalize room: ${roomId}`);
            return;
        }
        socket.join(normalizedRoom);
        socket.emit('joined_room', { roomId: normalizedRoom });
        console.log(`[ROOM-JOIN] Socket ${socket.id} joined room: ${normalizedRoom}`);
    });

    socket.on('chat_message', ({ roomId, message, senderName, messageId }) => {
        const normalizedRoom = normalizeRoomId(roomId);
        if (!normalizedRoom || !message) {
            console.warn(`[CHAT-MSG] Invalid message: room=${roomId}, message=${message}`);
            return;
        }

        const payload = {
            roomId: normalizedRoom,
            message: String(message),
            senderName: senderName || 'Anonymous',
            messageId: String(messageId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            timestamp: new Date().toISOString(),
        };

        console.log(`[CHAT-MSG-BROADCAST] From socket ${socket.id} to room ${normalizedRoom}:`, payload);
        io.to(normalizedRoom).emit('chat_message', payload);
    });

    socket.on('swap_request_sent', (data) => {
        const notification = {
            message: data.message || `${data.senderName || 'A user'} sent a swap request`,
            type: 'SWAP_REQUEST',
            targetEmail: data.teacherEmail || null,
            timestamp: new Date().toISOString(),
        };

        if (data?.roomId) {
            io.to(normalizeRoomId(data.roomId)).emit('notification', notification);
        } else {
            io.emit('notification', notification);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/swap-requests', swapRoutes);

// Concept 2 - SSR Admin Route [cite: 166, 206]
app.get('/admin', async (req, res) => {
    // Ensure user is attached from session
    if (!req.user) {
        return res.status(401).send('Authentication required');
    }

    // Only admin can access
    const isAdminUser = req.user?.isAdmin || req.user?.email === ADMIN_EMAIL;
    if (!isAdminUser) {
        return res.status(403).send('Access denied');
    }

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

// SSR Upload Page - Renders the EJS form with enctype="multipart/form-data" (Member 3)
app.get('/upload', (req, res) => {
    if (!req.user) {
        return res.status(401).send('Authentication required. Please log in to upload images.');
    }
    res.render('upload', { profileResult: null, skillResult: null });
});

app.get('/api/features', (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // This sends the error to your errorHandler.js
        const db = JSON.parse(data);
        res.json(db.features || []);
    });
});

app.post('/api/activity-log', authVerify,(req, res, next) => {
    const logPath = path.join(__dirname, 'data', 'activity.txt');
    const logEntry = `Activity: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        res.json({ message: 'Activity logged successfully' });
    });
});

// --- Performance Expert - True Streaming ---

app.get('/api/export-history', authVerify, (req, res, next) => {

    // Admin only
    const isAdminUser = req.user?.isAdmin || req.user?.email === ADMIN_EMAIL;
    if (!req.user || !isAdminUser) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const format = req.query.format === 'csv' ? 'csv' : 'json';

    res.setHeader('Content-Disposition', `attachment; filename="TradeReport.${format}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

    const readStream = fs.createReadStream(dbPath);
    readStream.pipe(res);
});

// Swap Reviews
app.get('/api/swap-reviews', authVerify, (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        res.json(db.swapReviews || []);
    });
});

// --- Static Serving ---

app.use(express.static(frontendDistPath));

app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Concept 1 - Final Error-handling Middleware
app.use(errorHandler);

const startServer = async () => {
  // 1. Only connect to DB and start the listener if we are NOT testing
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
      
      server.listen(PORT, '0.0.0.0', () => {
        console.log('====================================');
        console.log(`SERVER RUNNING: http://localhost:${PORT}`);
        console.log('====================================');
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }
};

startServer();

module.exports = app;