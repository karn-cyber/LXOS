import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Clan from '@/models/Clan';

function modelFor(type) {
    if (type === 'club') return Club;
    if (type === 'clan') return Clan;
    return null;
}

// Add or update a past-semester budget record. Admin only.
// Body: { entityType: 'club'|'clan', entityId, semester, budgetAllocated, budgetSpent }
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { entityType, entityId, semester } = body;
        const Model = modelFor(entityType);
        if (!Model || !entityId || !semester?.trim()) {
            return NextResponse.json({ error: 'entityType, entityId and semester are required' }, { status: 400 });
        }

        await dbConnect();
        const doc = await Model.findById(entityId);
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const allocated = Number(body.budgetAllocated) || 0;
        const spent = Number(body.budgetSpent) || 0;
        const sem = semester.trim();

        if (!Array.isArray(doc.budgetHistory)) doc.budgetHistory = [];
        const existing = doc.budgetHistory.find(h => h.semester === sem);
        if (existing) {
            existing.budgetAllocated = allocated;
            existing.budgetSpent = spent;
        } else {
            doc.budgetHistory.push({ semester: sem, budgetAllocated: allocated, budgetSpent: spent });
        }

        await doc.save();
        return NextResponse.json({ success: true, budgetHistory: JSON.parse(JSON.stringify(doc.budgetHistory)) });
    } catch (error) {
        console.error('Budget history POST error:', error);
        return NextResponse.json({ error: 'Failed to save semester budget' }, { status: 500 });
    }
}

// Remove a past-semester record. Body: { entityType, entityId, semester }
export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const { entityType, entityId, semester } = body;
        const Model = modelFor(entityType);
        if (!Model || !entityId || !semester) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        await dbConnect();
        await Model.updateOne({ _id: entityId }, { $pull: { budgetHistory: { semester } } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Budget history DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
