const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load MONGODB_URI from .env.local (plain node doesn't read it automatically).
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    const txt = fs.readFileSync(envPath, 'utf8');
    for (const line of txt.split('\n')) {
        const m = line.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/);
        if (m && !process.env.MONGODB_URI) process.env.MONGODB_URI = m[1].trim();
    }
}

(async () => {
    loadEnv();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const { default: Club } = await import('../models/Club.js');
    const { default: Clan } = await import('../models/Clan.js');
    await import('../models/User.js');
    await import('../models/Event.js');
    const { default: Reimbursement } = await import('../models/Reimbursement.js');

    console.log('=== CLUBS (name / allocated / spent) ===');
    const clubs = await Club.find().select('name budgetAllocated budgetSpent').lean();
    clubs.forEach(c => console.log(`  ${c.name}  alloc=${c.budgetAllocated} spent=${c.budgetSpent}  [${c._id}]`));

    console.log('\n=== CLANS (name / allocated / spent) ===');
    const clans = await Clan.find().select('name budgetAllocated budgetSpent').lean();
    clans.forEach(c => console.log(`  ${c.name}  alloc=${c.budgetAllocated} spent=${c.budgetSpent}  [${c._id}]`));

    console.log('\n=== REIMBURSEMENTS (recent 15) ===');
    const rs = await Reimbursement.find().sort({ createdAt: -1 }).limit(15)
        .populate('submittedBy', 'name email clubId clanId')
        .lean();
    rs.forEach(r => console.log(
        `  "${r.title}" ₹${r.amount} status=${r.status} clubId=${r.clubId || '-'} clanId=${r.clanId || '-'} deducted=${r.budgetDeducted} by=${r.submittedBy?.name || '?'} [${r._id}]`
    ));

    await mongoose.disconnect();
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
