// middleware/authVerify.js
// Member 4 - Task 6 & 7: JWT Token Verification Middleware

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tradeaskill_jwt_secret_2025';

/**
 * Middleware to verify JWT token from Authorization header.
 * Usage: app.get('/protected', authVerify, handler)
 *
 * How JWT works:
 *  1. User logs in → server signs a token with user ID + secret → returns token
 *  2. Client stores token (localStorage / cookie)
 *  3. Client sends token in every request: Authorization: Bearer <token>
 *  4. Server verifies signature → trusts the identity without hitting the DB every time
 */
const authVerify = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, iat, exp }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authVerify; 