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
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sessionConfig, attachCurrentUser } = require('./middleware/sessionHandler');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const User = require('./models/User');
const Skill = require('./models/Skill');

const app = express();

// View Engine Setup for SSR
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';

// 1. Dynamic CORS Configuration for REST API
const allowedOrigins = [
  'https://trade-a-skill-r5lu.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps) or matching our whitelist
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(sessionConfig);
app.use(attachCurrentUser);
app.use(logger);

const dbPath = path.join(__dirname, 'data', 'db.json');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

const server = http.createServer(app);

// 2. Updated Socket.io Configuration with Dynamic CORS
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
                callback(null, true);
            } else {
                callback(new Error('Socket CORS Error'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Socket Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));

        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'trade-a-skill-jwt-secret';
        const payload = jwt.verify(token, secret);
        
        // Use the actual User model from MongoDB for socket identity
        const user = await User.findById(payload.sub).lean();
        if (!user) return next(new Error('Invalid token'));

        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});

// Socket Event Handlers
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.firstName || 'Unknown'})`);

    socket.on('join_chat_room', ({ roomId }) => {
        socket.join(roomId);
        console.log(`[ROOM-JOIN] Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('chat_message', (data) => {
        io.to(data.roomId).emit('chat_message', {
            ...data,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on('swap_request_sent', (data) => {
        io.emit('notification', {
            message: `${data.senderName} requested a swap!`,
            type: 'SWAP_REQUEST',
            timestamp: new Date().toISOString(),
        });
    });

    socket.on('disconnect', () => console.log('Socket disconnected'));
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/swap-requests', swapRoutes);

// SSR Admin and Upload Routes
app.get('/admin', async (req, res) => {
    if (!req.user || (req.user.email !== ADMIN_EMAIL && !req.user.isAdmin)) {
        return res.status(403).send('Access denied');
    }
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    res.render('admin', { users });
});

app.get('/upload', (req, res) => {
    res.render('upload', { profileResult: null, skillResult: null });
});

// JSON DB Fallbacks (Concept 1)
app.get('/api/features', (req, res, next) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return next(err);
        const db = JSON.parse(data);
        res.json(db.features || []);
    });
});

// 4. Static Serving for Production
app.use(express.static(frontendDistPath));
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error Handling
app.use('/api', notFoundHandler);
app.use(errorHandler);

// 5. Database Connection and Server Startup
const startServer = async () => {
  // Ensure we don't connect/start during tests
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`SERVER RUNNING IN ${process.env.NODE_ENV || 'development'} MODE`);
        console.log(`LIVE AT: http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Critical Startup Failure:', err);
      process.exit(1);
    }
  }
};

startServer();

module.exports = app;