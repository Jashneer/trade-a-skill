require('dotenv').config();
const mongoose = require('mongoose');

const checkConnection = async () => {
    const primaryUri = process.env.MONGO_URI;
    const fallbackUri = process.env.MONGO_URI_FALLBACK;

    if (!primaryUri) {
        throw new Error('MONGO_URI is missing in .env');
    }

    try {
        await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB connection check: SUCCESS (MONGO_URI)');
        return;
    } catch (error) {
        const isSrvDnsIssue = String(error.message || '').includes('querySrv');
        if (!isSrvDnsIssue || !fallbackUri) {
            throw error;
        }

        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB connection check: SUCCESS (MONGO_URI_FALLBACK)');
    }
};

checkConnection()
    .catch((error) => {
        console.error('MongoDB connection check: FAILED');
        console.error(error.message);
        if (String(error.message || '').includes('querySrv')) {
            console.error('Tip: SRV DNS lookup failed. Add MONGO_URI_FALLBACK in .env using Atlas non-SRV connection string.');
        }
        process.exit(1);
    })
    .finally(async () => {
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // Ignore disconnect errors in checks.
        }
    });
