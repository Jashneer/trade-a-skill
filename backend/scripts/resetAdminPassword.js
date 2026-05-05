require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    const { MONGO_URI, MONGO_URI_FALLBACK } = process.env;
    const localFallbackUri = 'mongodb://127.0.0.1:27017/tradeaskill';

    if (MONGO_URI) {
        try {
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
            });
            console.log('Connected to MongoDB using MONGO_URI');
            return;
        } catch (error) {
            const isSrvDnsIssue = String(error.message || '').includes('querySrv');
            if (isSrvDnsIssue && MONGO_URI_FALLBACK) {
                try {
                    await mongoose.connect(MONGO_URI_FALLBACK, {
                        serverSelectionTimeoutMS: 10000,
                        connectTimeoutMS: 10000,
                    });
                    console.log('Connected to MongoDB using MONGO_URI_FALLBACK');
                    return;
                } catch (fallbackError) {
                    console.warn('Primary MongoURI failed and fallback also failed.');
                    throw fallbackError;
                }
            }
            throw error;
        }
    }

    try {
        await mongoose.connect(localFallbackUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        console.log('Connected to local MongoDB fallback');
    } catch (error) {
        console.error('Failed to connect to MongoDB. Please start MongoDB or set MONGO_URI.');
        throw error;
    }
};

const run = async () => {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
    const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD || 'Admin@123';

    await connectDB();

    const user = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (user) {
        user.password = hashedPassword;
        user.isAdmin = true;
        await user.save();
        console.log(`Updated admin password for ${adminEmail}`);
    } else {
        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: adminEmail,
            password: hashedPassword,
            bio: 'Administrator account',
            skillsToTeach: [],
            skillsToLearn: [],
            isAdmin: true,
        });
        console.log(`Created new admin user ${adminEmail}`);
    }

    console.log(`Admin password is now: ${newPassword}`);
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error('Reset admin password failed:', error.message || error);
    process.exit(1);
});
