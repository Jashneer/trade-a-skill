let prismaInstance = null;

const getPrisma = async () => {

    if (prismaInstance) {
        return prismaInstance;
    }

    // Directly use @prisma/client for CommonJS compatibility
    const { PrismaClient } = require('@prisma/client');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pg = require('pg');

    const connectionString = process.env.DATABASE_URL;

    const pool = new pg.Pool({
        connectionString
    });

    const adapter = new PrismaPg(pool);

    prismaInstance = new PrismaClient({
        adapter
    });

    return prismaInstance;
};

module.exports = getPrisma;