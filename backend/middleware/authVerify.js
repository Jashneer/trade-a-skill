const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authVerify = async (req, res, next) => {
    try {
        if (req.user) {
            return next();
        }

        if (req.session && req.session.userId) {
            const sessionUser = await User.findById(req.session.userId).lean();
            if (!sessionUser) {
                return res.status(401).json({ message: 'Session invalid. Please log in again.' });
            }
            req.user = sessionUser;
            return next();
        }

        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const secret = process.env.JWT_SECRET || 'trade-a-skill-jwt-secret';
        const payload = jwt.verify(token, secret);
        const user = await User.findById(payload.sub).lean();

        if (!user) {
            return res.status(401).json({ message: 'Token is invalid or expired' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }

        next(error);
    }
};

module.exports = authVerify;
