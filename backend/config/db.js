const mongoose = require('mongoose');

const connectDB = async () => {
    const { MONGO_URI, MONGO_URI_FALLBACK } = process.env;

    if (!MONGO_URI) {
        throw new Error('MONGO_URI is missing in environment variables');
    }

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log('MongoDB connected successfully using MONGO_URI');
    } catch (error) {
        const isSrvDnsIssue = String(error.message || '').includes('querySrv');
        if (!isSrvDnsIssue || !MONGO_URI_FALLBACK) {
            throw error;
        }

        await mongoose.connect(MONGO_URI_FALLBACK, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected successfully using MONGO_URI_FALLBACK');
    }
};

module.exports = connectDB;
