let prismaInstance = null;

const getPrisma = async () => {

    if (prismaInstance) {
        return prismaInstance;
    }

    const prismaModule = await import('../generated/prisma/client.ts');

    const { PrismaPg } = await import('@prisma/adapter-pg');

    const pg = await import('pg');

    const connectionString = process.env.DATABASE_URL;

    const pool = new pg.Pool({
        connectionString
    });

    const adapter = new PrismaPg(pool);

    const PrismaClient =
        prismaModule.PrismaClient ||
        prismaModule.default?.PrismaClient;

    prismaInstance = new PrismaClient({
        adapter
    });

    return prismaInstance;
};

module.exports = getPrisma;