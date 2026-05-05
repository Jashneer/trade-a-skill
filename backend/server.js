const express = require('express');
const authVerify = require('./middleware/authVerify');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { sessionConfig, attachCurrentUser } = require('./middleware/sessionHandler');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
const Skill = require('./models/Skill');

const app = express();

// Concept 2 Setup for EJS 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json()); // Built-in Body-parser
app.use(sessionConfig); // Session management middleware
app.use(attachCurrentUser); // Attach current user from session if available

// Application-level middleware to log every request
app.use(logger);

const dbPath = path.join(__dirname, 'data', 'db.json');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use('/api/auth', authRoutes);

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

app.get('/api/users', authVerify, async (req, res) => {
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
        req.session.userId = createdUser._id;
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

app.patch('/api/users/:id', authVerify, async (req, res) => {
    try {
        const userId = req.params.id;
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

const updates = { ...req.body };
if (updates.password) {
    return res.status(400).json({ message: 'Password update not allowed here' });
}
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

app.post('/api/activity-log', authVerify,(req, res, next) => {
    const logPath = path.join(__dirname, 'data', 'activity.txt');
    const logEntry = `Activity: ${JSON.stringify(req.body)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        res.json({ message: 'Activity logged successfully' });
    });
});

app.get('/api/swap-requests',  authVerify, (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err); // Concept 1: Pass error to global handler

        const db = JSON.parse(data);
        res.json(db.swapRequests || []);
    });
});

app.post('/api/swap-requests', authVerify, (req, res, next) => {
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

app.delete('/api/swap-requests/:id', authVerify,(req, res, next) => {
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
    await connectDB();

    app.listen(PORT, () => {
        console.log('==========================================');
        console.log(`SERVER RUNNING: http://localhost:${PORT}`);
        console.log('==========================================');
    });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});