const mongoose = require('mongoose');

const connectDB = async () => {
    const { MONGO_URI, MONGO_URI_FALLBACK } = process.env;

    if (!MONGO_URI) {
        throw new Error('MONGO_URI is missing in environment variables');
    }

    const localFallbackUri = 'mongodb://127.0.0.1:27017/tradeaskill';

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });

        console.log('MongoDB connected successfully using MONGO_URI');
        return;
    } catch (error) {
        const isSrvDnsIssue = String(error.message || '').includes('querySrv');
        const canTryAtlasFallback = isSrvDnsIssue && MONGO_URI_FALLBACK;

        if (canTryAtlasFallback) {
            try {
                await mongoose.connect(MONGO_URI_FALLBACK, {
                    serverSelectionTimeoutMS: 10000,
                    connectTimeoutMS: 10000,
                });
                console.log('MongoDB connected successfully using MONGO_URI_FALLBACK');
                return;
            } catch (fallbackError) {
                console.warn('Primary MongoDB URI failed and fallback URI also failed.');
                error = fallbackError;
            }
        }

        try {
            await mongoose.connect(localFallbackUri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
            });
            console.log('MongoDB connected successfully using local fallback URI');
            return;
        } catch (localError) {
            console.error('All MongoDB connection attempts failed.');
            throw localError;
        }
    }
};

module.exports = connectDB;
