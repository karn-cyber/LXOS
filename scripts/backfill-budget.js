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

(async () => {
    loadEnv();
    await mongoose.connect(process.env.MONGODB_URI);

    const { default: Club } = await import('../models/Club.js');
    const { default: Clan } = await import('../models/Clan.js');
    await import('../models/User.js');
    await import('../models/Event.js');
    const { default: Reimbursement } = await import('../models/Reimbursement.js');
    const { default: User } = await import('../models/User.js');

    const COMMITTED = ['APPROVED', 'PROCESSED'];

    // 1) Attribute any unattributed committed claim to the submitter's club/clan
    //    by matching the submitter's name to a club/clan (best-effort), and link
    //    the user so future claims auto-capture it.
    const claims = await Reimbursement.find({ status: { $in: COMMITTED } })
        .populate('submittedBy', 'name email clubId clanId')
        .lean();

    const clubs = await Club.find().select('name').lean();
    const clans = await Clan.find().select('name').lean();
    const norm = (s) => String(s || '').toLowerCase();

    for (const c of claims) {
        let clubId = c.clubId;
        let clanId = c.clanId;

        // Derive from submitter's existing link, else fuzzy-match their name to a club/clan.
        if (!clubId && !clanId && c.submittedBy) {
            clubId = c.submittedBy.clubId || null;
            clanId = c.submittedBy.clanId || null;
            if (!clubId && !clanId) {
                const nm = norm(c.submittedBy.name);
                const club = clubs.find(cl => nm.includes(norm(cl.name)) || norm(cl.name).split(' ').some(w => w.length > 3 && nm.includes(w)));
                const clan = clans.find(cl => nm.includes(norm(cl.name)));
                if (club) clubId = club._id;
                else if (clan) clanId = clan._id;
                // Link the user so future claims capture it automatically.
                if ((club || clan) && c.submittedBy._id) {
                    await User.updateOne({ _id: c.submittedBy._id }, { $set: club ? { clubId: club._id } : { clanId: clan._id } });
                    console.log(`Linked user ${c.submittedBy.name} -> ${(club || clan).name}`);
                }
            }
        }

        const needsAttribution = (clubId && !c.clubId) || (clanId && !c.clanId);
        const needsDeduction = !c.budgetDeducted && (clubId || clanId);

        if (needsAttribution || needsDeduction) {
            if (clubId) await Club.updateOne({ _id: clubId }, { $inc: { budgetSpent: c.amount } });
            if (clanId) await Clan.updateOne({ _id: clanId }, { $inc: { budgetSpent: c.amount } });
            await Reimbursement.updateOne({ _id: c._id }, { $set: { clubId: clubId || null, clanId: clanId || null, budgetDeducted: true } });
            console.log(`Deducted ₹${c.amount} for "${c.title}" -> ${clubId ? 'club ' + clubId : 'clan ' + clanId}`);
        } else {
            console.log(`Skipped "${c.title}" (clubId=${c.clubId || '-'} clanId=${c.clanId || '-'} deducted=${c.budgetDeducted})`);
        }
    }

    console.log('\nDone.');
    await mongoose.disconnect();
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
