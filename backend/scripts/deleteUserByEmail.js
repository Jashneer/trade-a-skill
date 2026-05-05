require('dotenv').config();
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
    const emailToDelete = process.argv[2];

    if (!emailToDelete) {
        console.error('Usage: npm run user:delete -- "your-email@example.com"');
        process.exit(1);
    }

    const normalizedEmail = emailToDelete.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        console.log(`No user found with email: ${normalizedEmail}`);
        await mongoose.disconnect();
        return;
    }

    await User.deleteOne({ email: normalizedEmail });
    console.log(`✓ User account deleted: ${normalizedEmail}`);
    console.log(`✓ All associated data has been permanently removed.`);

    await mongoose.disconnect();
};

run().catch((error) => {
    console.error('Delete user failed:', error.message || error);
    process.exit(1);
});
