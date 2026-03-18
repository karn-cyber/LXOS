const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnvLocalIfNeeded() {
    if (process.env.MONGODB_URI) return;

    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const file = fs.readFileSync(envPath, 'utf8');
    const lines = file.split(/\r?\n/);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || !line.includes('=')) continue;

        const idx = line.indexOf('=');
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

async function seedRoleBasedUsers() {
    try {
        loadEnvLocalIfNeeded();

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined. Add it to .env.local or your shell environment.');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const { default: User } = await import('../models/User.js');
        const { default: Club } = await import('../models/Club.js');

        const deleteResult = await User.deleteMany({});
        console.log(`🧹 Cleared users collection (${deleteResult.deletedCount} deleted)`);

        let club = await Club.findOne({ isActive: true }).sort({ createdAt: 1 });

        if (!club) {
            club = await Club.create({
                name: 'General Club',
                description: 'Default club for seeded role-based users',
                category: 'Other',
                budgetAllocated: 0,
                budgetSpent: 0,
                isActive: true,
            });
            console.log('📌 No active club found. Created default club: General Club');
        }

        const usersToSeed = [
            {
                name: 'Admin',
                email: 'admin@lxos.edu',
                password: 'admin123',
                role: 'ADMIN',
            },
            {
                name: 'LX Team',
                email: 'lx@lxos.edu',
                password: 'lx123',
                role: 'LX_TEAM',
            },
            {
                name: 'Club Head',
                email: 'clubhead@lxos.edu',
                password: 'club123',
                role: 'CLUB_HEAD',
                clubId: club._id,
            },
            {
                name: 'Finance',
                email: 'finance@lxos.edu',
                password: 'finance123',
                role: 'FINANCE',
            },
        ];

        const hashedUsers = await Promise.all(
            usersToSeed.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 10),
            }))
        );

        await User.insertMany(hashedUsers);

        console.log('✅ Seeded role-based users successfully:');
        usersToSeed.forEach((u) => {
            console.log(`   - ${u.role}: ${u.email}`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ User seeding failed:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

seedRoleBasedUsers();
