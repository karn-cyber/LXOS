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
        const { default: Room } = await import('../models/Room.js');

        const requestedClubs = [
            { name: 'Society for Aerospace and Space Technology', category: 'Technical' },
            { name: 'Kalakriti', category: 'Cultural' },
            { name: 'Public Policy Club', category: 'Academic' },
            { name: 'Inkspire Club', category: 'Cultural' },
            { name: 'Finanza Club', category: 'Academic' },
            { name: 'Robotics Club', category: 'Technical' },
            { name: 'Arthakram', category: 'Academic' },
            { name: 'ECell', category: 'Academic' },
            { name: 'Saarang', category: 'Cultural' },
            { name: 'Swaarang', category: 'Cultural' },
            { name: 'Navrasa', category: 'Cultural' },
        ];

        const buildRoomRange = (prefix, start, end) => {
            const rooms = [];
            for (let n = start; n <= end; n += 1) {
                rooms.push(`${prefix}${String(n).padStart(3, '0')}`);
            }
            return rooms;
        };

        const roomNames = [
            ...buildRoomRange('A-', 103, 105),
            ...buildRoomRange('A-', 201, 213),
            ...buildRoomRange('A-', 303, 313),
            ...buildRoomRange('A-', 401, 411), // Interpreted from "A-401 to A-111"
            ...buildRoomRange('A-', 501, 511),
            'C-101', 'C-102',
            'C-201', 'C-202',
            'C-301', 'C-302',
        ];

        const getRoomCapacity = (name) => {
            if (name.startsWith('A-3') || name.startsWith('A-4') || name.startsWith('A-5')) {
                return 120;
            }
            return 60;
        };

        const defaultFacilities = ['Projector', 'Whiteboard', 'Air Conditioning'];

        console.log('🏫 Ensuring requested clubs exist...');
        let clubsCreated = 0;
        for (const clubData of requestedClubs) {
            const result = await Club.updateOne(
                { name: clubData.name },
                {
                    $setOnInsert: {
                        name: clubData.name,
                        description: `Official ${clubData.name} club`,
                    },
                    $set: {
                        isActive: true,
                        category: clubData.category,
                        budgetAllocated: 10000,
                    },
                },
                { upsert: true }
            );

            if (result.upsertedCount) {
                clubsCreated += 1;
            }
        }
        console.log(`✅ Clubs ready (${requestedClubs.length} total requested, ${clubsCreated} newly created)`);

        console.log('🏫 Ensuring requested rooms exist...');
        let roomsCreated = 0;

        for (const name of roomNames) {
            const capacity = getRoomCapacity(name);
            const block = name.split('-')[0];

            const result = await Room.updateOne(
                { name },
                {
                    $setOnInsert: {
                        name,
                        type: 'Classroom',
                        location: `${block} Block`,
                    },
                    $set: {
                        capacity,
                        facilities: defaultFacilities,
                        isAvailable: true,
                    },
                },
                { upsert: true }
            );

            if (result.upsertedCount) {
                roomsCreated += 1;
            }
        }

        const auditoriumRooms = [
            {
                name: 'A-314',
                type: 'Auditorium',
                capacity: 150,
                location: 'A Block',
                facilities: ['Projector', 'Air Conditioning', 'Sound System', 'Stage'],
            },
            {
                name: 'Main Auditorium',
                type: 'Auditorium',
                capacity: 350,
                location: 'Main Block',
                facilities: ['Projector', 'Air Conditioning', 'Sound System', 'Stage'],
            },
        ];

        for (const room of auditoriumRooms) {
            const result = await Room.updateOne(
                { name: room.name },
                {
                    $setOnInsert: {
                        name: room.name,
                    },
                    $set: {
                        type: room.type,
                        capacity: room.capacity,
                        location: room.location,
                        facilities: room.facilities,
                        isAvailable: true,
                    },
                },
                { upsert: true }
            );

            if (result.upsertedCount) {
                roomsCreated += 1;
            }
        }

        console.log(`✅ Rooms ready (${roomNames.length + auditoriumRooms.length} total requested, ${roomsCreated} newly created)`);

        const deleteResult = await User.deleteMany({});
        console.log(`🧹 Cleared users collection (${deleteResult.deletedCount} deleted)`);

        let club = await Club.findOne({ name: 'Society for Aerospace and Space Technology', isActive: true });

        if (!club) {
            club = await Club.create({
                name: 'Society for Aerospace and Space Technology',
                description: 'Official Society for Aerospace and Space Technology club',
                category: 'Technical',
                budgetAllocated: 10000,
                budgetSpent: 0,
                isActive: true,
            });
            console.log('📌 Created fallback club: Society for Aerospace and Space Technology');
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
