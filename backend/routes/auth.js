// routes/auth.js
// Member 4 - Task 6 & 7: Authentication Routes (Register, Login, Me)
// Implements: Bcrypt password hashing + JWT token generation + Passport JWT protection

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tradeaskill_jwt_secret_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = 12;

// Helper: Generate signed JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id || user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// ─────────────────────────────────────────────
// POST /api/auth/register
// Register new user with hashed password
// ─────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const {
            firstName, lastName, email, password,
            bio, skillsToTeach, skillsToLearn
        } = req.body;

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'firstName, lastName, email and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        // Check for duplicate email
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        // Hash password with bcrypt (SALT_ROUNDS = 12 means 2^12 iterations)
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const normalize = (arr) =>
            Array.isArray(arr)
                ? arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
                : [];

        const newUser = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword, // Store hashed, never plain text
            bio: (bio || '').trim(),
            skillsToTeach: normalize(skillsToTeach),
            skillsToLearn: normalize(skillsToLearn),
            dateJoined: new Date().toLocaleDateString(),
            rating: 0,
            trades: 0,
        });

        const token = generateToken(newUser);

        const userResponse = newUser.toJSON();
        delete userResponse.password; // Never expose password

        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: userResponse,
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Login with email + password, returns JWT
// ─────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user (include password field for comparison)
        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+password')
            .lean();

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // bcrypt.compare does timing-safe comparison
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        const userResponse = { ...user };
        delete userResponse.password;
        userResponse.id = String(userResponse._id);
        delete userResponse._id;

        res.json({
            message: 'Login successful.',
            token,
            user: userResponse,
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Protected route — returns current user from JWT
// Uses Passport JWT strategy
// ─────────────────────────────────────────────
router.get(
    '/me',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const userResponse = { ...req.user };
        delete userResponse.password;
        userResponse.id = String(userResponse._id);
        delete userResponse._id;
        res.json({ user: userResponse });
    }
);

// ─────────────────────────────────────────────
// POST /api/auth/logout
// Client-side: just discard token.
// Server-side: respond with confirmation.
// ─────────────────────────────────────────────
router.post('/logout', (req, res) => {
    // JWT is stateless — actual logout happens on the client by deleting the token.
    res.json({ message: 'Logged out successfully. Please delete your token on the client.' });
});

module.exports = router;