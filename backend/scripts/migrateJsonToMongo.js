require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Skill = require('../models/Skill');

const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');

const normalizeSkillArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean);
};

const migrateUsers = async (usersFromJson) => {
    let imported = 0;
    let skipped = 0;

    for (const rawUser of usersFromJson) {
        const payload = {
            firstName: String(rawUser.firstName || '').trim(),
            lastName: String(rawUser.lastName || '').trim(),
            email: String(rawUser.email || '').trim().toLowerCase(),
            password: String(rawUser.password || ''),
            bio: String(rawUser.bio || '').trim(),
            skillsToTeach: normalizeSkillArray(rawUser.skillsToTeach),
            skillsToLearn: normalizeSkillArray(rawUser.skillsToLearn),
            dateJoined: String(rawUser.dateJoined || new Date().toLocaleDateString()),
            rating: Number(rawUser.rating || 0),
            trades: Number(rawUser.trades || 0),
        };

        if (!payload.firstName || !payload.lastName || !payload.email || !payload.password) {
            skipped += 1;
            continue;
        }

        try {
            await User.findOneAndUpdate(
                { email: payload.email },
                payload,
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );
            imported += 1;
        } catch (error) {
            skipped += 1;
            console.warn(`Skipped user ${payload.email}: ${error.message}`);
        }
    }

    return { imported, skipped };
};

const migrateSkills = async (skillsFromJson) => {
    let imported = 0;
    let skipped = 0;

    for (const rawSkill of skillsFromJson) {
        const payload = {
            title: String(rawSkill.title || '').trim(),
            description: String(rawSkill.description || '').trim(),
            category: String(rawSkill.category || '').trim().toLowerCase(),
            level: String(rawSkill.level || '').trim().toLowerCase(),
            duration: String(rawSkill.duration || '').trim(),
            teacher: {
                name: String(rawSkill.teacher?.name || '').trim(),
                rating: Number(rawSkill.teacher?.rating || 0),
                completedTrades: Number(rawSkill.teacher?.completedTrades || 0),
            },
        };

        if (!payload.title || !payload.teacher.name) {
            skipped += 1;
            continue;
        }

        try {
            await Skill.findOneAndUpdate(
                { title: payload.title, 'teacher.name': payload.teacher.name },
                payload,
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );
            imported += 1;
        } catch (error) {
            skipped += 1;
            console.warn(`Skipped skill ${payload.title}: ${error.message}`);
        }
    }

    return { imported, skipped };
};

const runMigration = async () => {
    if (!fs.existsSync(dbJsonPath)) {
        throw new Error(`db.json not found at ${dbJsonPath}`);
    }

    const raw = fs.readFileSync(dbJsonPath, 'utf8');
    const parsed = JSON.parse(raw);

    await connectDB();

    const userResult = await migrateUsers(Array.isArray(parsed.users) ? parsed.users : []);
    const skillResult = await migrateSkills(Array.isArray(parsed.skills) ? parsed.skills : []);

    console.log('Migration complete');
    console.log(`Users imported/updated: ${userResult.imported}, skipped: ${userResult.skipped}`);
    console.log(`Skills imported/updated: ${skillResult.imported}, skipped: ${skillResult.skipped}`);
};

runMigration()
    .catch((error) => {
        console.error('Migration failed:', error.message);
        if (String(error.message || '').includes('querySrv')) {
            console.error('Tip: Add MONGO_URI_FALLBACK in .env using Atlas non-SRV connection string, then run npm run db:migrate again.');
        }
        process.exit(1);
    })
    .finally(async () => {
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // Ignore disconnect errors during shutdown.
        }
    });
