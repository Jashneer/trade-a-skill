// ============================================================
// DNS Workaround Script for Neon.tech Migration
// ============================================================
// Your local DNS server can't resolve Neon's hostname.
// This script uses a resolved IP address directly and connects
// using the SNI hostname for SSL/TLS.
// ============================================================

const { Client } = require('pg');

// The SQL that creates all tables — equivalent to what Prisma migrate generates
const migrationSQL = `
-- CreateEnum: SkillCategory
DO $$ BEGIN
    CREATE TYPE "SkillCategory" AS ENUM ('technology', 'language', 'arts', 'business', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SkillLevel
DO $$ BEGIN
    CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'flexible');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SwapStatus
DO $$ BEGIN
    CREATE TYPE "SwapStatus" AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" VARCHAR(500) NOT NULL DEFAULT '',
    "skillsToTeach" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsToLearn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dateJoined" TEXT NOT NULL DEFAULT '',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trades" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: skills
CREATE TABLE IF NOT EXISTS "skills" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "duration" VARCHAR(60) NOT NULL,
    "teacherName" VARCHAR(100) NOT NULL,
    "teacherRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teacherCompletedTrades" INTEGER NOT NULL DEFAULT 0,
    "teacherId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable: swap_requests
CREATE TABLE IF NOT EXISTS "swap_requests" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "skillOffered" TEXT NOT NULL,
    "skillRequested" TEXT NOT NULL,
    "status" "SwapStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- AddForeignKey: skills -> users (teacher)
DO $$ BEGIN
    ALTER TABLE "skills" ADD CONSTRAINT "skills_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: swap_requests -> users (fromUser)
DO $$ BEGIN
    ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_fromUserId_fkey" 
    FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: swap_requests -> users (toUser)
DO $$ BEGIN
    ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_toUserId_fkey" 
    FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`;

async function runMigration() {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    
    // Connect using IP directly (bypasses broken local DNS)
    // The SNI hostname is required by Neon to route to your project
    const client = new Client({
        host: '13.251.17.193',
        port: 5432,
        database: 'neondb',
        user: 'neondb_owner',
        password: 'npg_zsB4yXvpRW7o',
        ssl: {
            rejectUnauthorized: false,
            servername: 'ep-sparkling-band-ao9cxwt3-pooler.c-2.ap-southeast-1.aws.neon.tech',
        },
    });

    try {
        await client.connect();
        console.log('✅ Connected to Neon PostgreSQL!');
        
        console.log('📦 Creating enums and tables...');
        await client.query(migrationSQL);
        console.log('✅ All tables created successfully!');

        // Verify by listing tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('\n📋 Tables in your database:');
        result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
        
        // Also list enums
        const enumResult = await client.query(`
            SELECT t.typname as enum_name, 
                   string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            GROUP BY t.typname
            ORDER BY t.typname;
        `);
        
        console.log('\n🏷️  Enums in your database:');
        enumResult.rows.forEach(row => console.log(`   ✓ ${row.enum_name}: [${row.values}]`));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔒 Connection closed.');
    }
}

runMigration();
