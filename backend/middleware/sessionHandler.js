const session = require('express-session');
const User = require('../models/User');

const sessionConfig = session({
    name: 'trade-a-skill.sid',
    secret: process.env.SESSION_SECRET || 'trade-a-skill-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
});

const attachCurrentUser = async (req, res, next) => {
    if (!req.session || !req.session.userId) return next();

    try {
        const user = await User.findById(req.session.userId).lean();
        if (user) {
            req.user = user;
        }
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    sessionConfig,
    attachCurrentUser,
};
