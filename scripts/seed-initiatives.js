const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const txt = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    for (const line of txt.split('\n')) {
        const m = line.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/);
        if (m && !process.env.MONGODB_URI) process.env.MONGODB_URI = m[1].trim();
    }
}

// The three most recent semesters and a representative date for each.
const SEMESTERS = [
    { name: 'Holi 2025', date: '2025-03-14' },
    { name: 'Diwali 2025', date: '2025-10-20' },
    { name: 'Holi 2026', date: '2026-03-03' },
];

(async () => {
    loadEnv();
    await mongoose.connect(process.env.MONGODB_URI);

    const { default: Clan } = await import('../models/Clan.js');
    const { default: Initiative } = await import('../models/Initiative.js');

    const clans = await Clan.find().select('name').lean();
    console.log(`Found ${clans.length} clans.`);

    let created = 0, skipped = 0;
    for (const clan of clans) {
        for (const sem of SEMESTERS) {
            const exists = await Initiative.findOne({ clanId: clan._id, semester: sem.name, title: 'Cleanliness Drive' });
            if (exists) { skipped++; continue; }
            await Initiative.create({
                title: 'Cleanliness Drive',
                description: `Campus-wide cleanliness drive conducted by ${clan.name} during ${sem.name}.`,
                clanId: clan._id,
                semester: sem.name,
                status: 'COMPLETED',
                date: new Date(sem.date),
            });
            created++;
            console.log(`+ ${clan.name} — ${sem.name}`);
        }
    }

    console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed).`);
    await mongoose.disconnect();
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
