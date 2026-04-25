const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authVerify = require('../middleware/authVerify');

const router = express.Router();

const createToken = (user) => {
    const secret = process.env.JWT_SECRET || 'trade-a-skill-jwt-secret';
    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
        },
        secret,
        { expiresIn: '7d' }
    );
};

const buildSafeUser = (userDoc) => {
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    delete user._id;
    return user;
};

router.post('/signup', async (req, res, next) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            bio = '',
            skillsToTeach = [],
            skillsToLearn = [],
        } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Please provide firstName, lastName, email, and password.' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const createdUser = await User.create({
            firstName,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            bio,
            skillsToTeach,
            skillsToLearn,
        });

        req.session.userId = createdUser._id.toString();
        const token = createToken(createdUser);
        res.status(201).json({
            token,
            user: buildSafeUser(createdUser),
        });
    } catch (error) {
        if (error && (error.name === 'ValidationError' || error.name === 'StrictModeError')) {
            return res.status(400).json({ message: error.message });
        }
        if (error && error.code === 11000) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        const passwordNeedsMigration = !passwordMatches && user.password === password;

        if (!passwordMatches && !passwordNeedsMigration) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (passwordNeedsMigration) {
            user.password = await bcrypt.hash(password, 12);
            await user.save();
        }

        req.session.userId = user._id.toString();
        const token = createToken(user);

        res.json({
            token,
            user: buildSafeUser(user),
        });
    } catch (error) {
        next(error);
    }
});

router.post('/logout',authVerify, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('trade-a-skill.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

router.get('/me', authVerify, async (req, res) => {
    res.json({ user: buildSafeUser(req.user) });
});

module.exports = router;
