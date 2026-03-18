import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';

// Update clan points
export async function PATCH(request, { params }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { points, reason } = body;

        if (typeof points !== 'number') {
            return NextResponse.json({ error: 'Points must be a number' }, { status: 400 });
        }

        const clan = await Clan.findByIdAndUpdate(
            id,
            { 
                $set: { points },
                $push: {
                    pointHistory: {
                        points,
                        previousPoints: 0, // Will be updated in a more complex implementation
                        reason: reason || 'Manual adjustment by admin',
                        updatedBy: session.user.id,
                        date: new Date()
                    }
                }
            },
            { new: true, runValidators: true }
        );

        if (!clan) {
            return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            clan,
            message: `Points updated to ${points} for ${clan.name}`
        });
    } catch (error) {
        console.error('Points update error:', error);
        return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
    }
}
