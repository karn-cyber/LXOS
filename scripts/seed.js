const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { join } = require('path');

// Models (Need to be required roughly)
// Since we are not using ESM in this script for simplicity or need to use dynamic imports if models are ESM
// But the project seems to use ESM. Let's try to map it.

console.log('Seed script starting...');

const seedDatabase = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Dynamic Imports for Models (since project is ESM)
        const { default: User } = await import('../models/User.js');
        const { default: Club } = await import('../models/Club.js');
        const { default: Clan } = await import('../models/Clan.js');
        const { default: Room } = await import('../models/Room.js');
        const { default: Event } = await import('../models/Event.js');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Club.deleteMany({}),
            Clan.deleteMany({}),
            Room.deleteMany({}),
            Event.deleteMany({}),
        ]);
        console.log('Data cleared');

        // 1. Create Clubs
        console.log('Creating clubs...');
        const clubData = [
            { name: 'SAST', email: 'sast@rishihood.edu.in', category: 'Technical' },
            { name: 'Content Team', email: 'content@rishihood.edu.in', category: 'Other' },
            { name: 'Fine Arts Club', email: 'finearts.club@rishihood.edu.in', category: 'Cultural' },
            { name: 'GDG', email: 'gdg@rishihood.edu.in', category: 'Technical' },
            { name: 'Robotics Club', email: 'robotics.club@rishihood.edu.in', category: 'Technical' },
            { name: 'Dance Club', email: 'dance.club@rishihood.edu.in', category: 'Cultural' },
            { name: 'Theatre Club', email: 'theatre.club@rishihood.edu.in', category: 'Cultural' },
            { name: 'Finanza', email: 'finanza@rishihood.edu.in', category: 'Academic' },
            { name: 'GD Club', email: 'gdclub@nst.rishihood.edu.in', category: 'Other' },
            { name: 'AI Club', email: 'aiclub@nst.rishihood.edu.in', category: 'Technical' },
            { name: 'SAGE', email: 'sage.club@rishihood.edu.in', category: 'Social' },
        ];

        const createdClubs = [];
        for (const data of clubData) {
            const club = await Club.create({
                name: data.name,
                description: `Official ${data.name} of Rishihood University`,
                category: data.category,
                budgetAllocated: 100000,
                budgetSpent: 0
            });
            // Store email with object for user mapping
            createdClubs.push({ ...club.toObject(), email: data.email });
        }
        console.log(`Created ${createdClubs.length} clubs`);

        // 2. Create Clans
        console.log('Creating clans...');
        const clanData = [
            { name: 'Maratha', email: 'maratha.clan@rishihood.edu.in', color: 'bg-orange-500' },
            { name: 'Vijaya', email: 'vijaya.clan@rishihood.edu.in', color: 'bg-green-500' },
            { name: 'Chola', email: 'chola.clan@rishihood.edu.in', color: 'bg-purple-500' },
            { name: 'Rajputana', email: 'rajputana.clan@rishihood.edu.in', color: 'bg-red-500' },
        ];

        const createdClans = [];
        for (const data of clanData) {
            const clan = await Clan.create({
                name: data.name,
                points: 0,
                budgetAllocated: 50000,
                color: data.color
            });
            createdClans.push({ ...clan.toObject(), email: data.email });
        }
        console.log(`Created ${createdClans.length} clans`);

        // 3. Create Rooms
        console.log('Creating rooms...');
        const classroomList = [
            'C-103', 'C-104',
            'A-303', 'A-304',
            'Mini Audi',
            'A-401', 'A-402', 'A-403', 'A-404', 'A-405', 'A-406', 'A-407', 'A-408', 'A-409', 'A-410',
            'A-501', 'A-502', 'A-503', 'A-504', 'A-505', 'A-506', 'A-507', 'A-508', 'A-509', 'A-510'
        ];

        await Room.create(
            classroomList.map(name => {
                let type = 'Classroom';
                let capacity = 60;
                let facilities = ['Projector', 'Whiteboard', 'Air Conditioning'];

                if (name === 'Mini Audi') {
                    type = 'Auditorium';
                    capacity = 150;
                    facilities.push('Sound System', 'Stage');
                } else if (name.startsWith('C-')) {
                    type = 'Classroom';
                }

                return {
                    name,
                    type,
                    capacity,
                    location: `${name.split('-')[0]} Block`,
                    facilities,
                    isAvailable: true
                };
            })
        );
        console.log('Created rooms');

        // 4. Create Users
        console.log('Creating users...');
        const password = 'admin123'; // Plain text, let the model pre-save hook hash it

        // Admins
        const adminEmails = [
            'yashika.b@rishihood.edu.in',
            'mehak.m@rishihood.edu.in',
            'sandeep.s@rishihood.edu.in',
            'neelanshu.2024@nst.rishihood.edu.in',
            'soumya.a@rishihood.edu.in'
        ];

        for (const email of adminEmails) {
            await User.create({
                name: email.split('@')[0],
                email,
                password,
                role: 'ADMIN',
            });
        }

        // Club Heads
        for (const club of createdClubs) {
            if (club.email) {
                await User.create({
                    name: `${club.name} Head`,
                    email: club.email,
                    password,
                    role: 'CLUB_HEAD',
                    clubId: club._id,
                });
            }
        }

        // Clan Heads
        for (const clan of createdClans) {
            if (clan.email) {
                await User.create({
                    name: `${clan.name} Clan Head`,
                    email: clan.email,
                    password,
                    role: 'CLAN_HEAD',
                    clanId: clan._id
                });
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
