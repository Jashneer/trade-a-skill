// backend/config/passport.js — FINAL VERSION
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tradeaskill_jwt_secret_2025';

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
        try {
            const user = await User.findById(jwtPayload.id).lean();
            if (!user) return done(null, false, { message: 'User not found' });
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    })
);

module.exports = passport;