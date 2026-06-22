import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Clan from '@/models/Clan';

// Close the current semester and open a new one. Admin / LX only.
// Snapshots each club/clan's current budget into budgetHistory, then sets the
// new active semester (the one budget is deducted from going forward). The new
// semester keeps the same allocation but resets spent to 0 — adjust allocations
// afterwards as needed. Body: { newSemester, resetAllocation? }
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'LX_TEAM'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Only Admin / LX can roll over the semester' }, { status: 403 });
        }

        const body = await request.json();
        const newSemester = (body.newSemester || '').trim();
        const resetAllocation = !!body.resetAllocation;
        if (!newSemester) {
            return NextResponse.json({ error: 'New semester name is required' }, { status: 400 });
        }

        await dbConnect();

        let count = 0;
        for (const Model of [Club, Clan]) {
            const docs = await Model.find();
            for (const doc of docs) {
                if (doc.semester === newSemester) continue; // already on this semester
                if (!Array.isArray(doc.budgetHistory)) doc.budgetHistory = [];
                // Archive the closing semester (update if it already exists).
                const existing = doc.budgetHistory.find(h => h.semester === doc.semester);
                if (existing) {
                    existing.budgetAllocated = doc.budgetAllocated;
                    existing.budgetSpent = doc.budgetSpent;
                } else {
                    doc.budgetHistory.push({
                        semester: doc.semester,
                        budgetAllocated: doc.budgetAllocated,
                        budgetSpent: doc.budgetSpent,
                    });
                }
                // Open the new semester.
                doc.semester = newSemester;
                doc.budgetSpent = 0;
                if (resetAllocation) doc.budgetAllocated = 0;
                await doc.save();
                count++;
            }
        }

        return NextResponse.json({ success: true, updated: count, semester: newSemester });
    } catch (error) {
        console.error('Semester rollover error:', error);
        return NextResponse.json({ error: 'Failed to roll over semester' }, { status: 500 });
    }
}
