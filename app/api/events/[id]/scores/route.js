import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Clan from '@/models/Clan';

// Submit event scores for all clans
export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { clanScores } = body; // { clanId: score, clanId: score, ... }

        if (!clanScores || typeof clanScores !== 'object') {
            return NextResponse.json({ error: 'Invalid clan scores format' }, { status: 400 });
        }

        // Update the event with clan scores
        const event = await Event.findByIdAndUpdate(
            id,
            { 
                clanScores,
                isCompleted: true,
                completedAt: new Date(),
                completedBy: session.user.id
            },
            { new: true }
        );

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Update clan points based on scores
        const updatePromises = Object.entries(clanScores).map(async ([clanId, score]) => {
            if (typeof score === 'number' && score > 0) {
                const clan = await Clan.findById(clanId);
                if (clan) {
                    const newPoints = clan.points + score;
                    await Clan.findByIdAndUpdate(clanId, {
                        points: newPoints,
                        $push: {
                            pointHistory: {
                                points: score,
                                previousPoints: clan.points,
                                reason: `Points from event: ${event.title}`,
                                eventId: id,
                                updatedBy: session.user.id,
                                date: new Date()
                            }
                        }
                    });
                    return { clanId, clanName: clan.name, pointsAdded: score, newTotal: newPoints };
                }
            }
            return null;
        });

        const results = await Promise.all(updatePromises);
        const validResults = results.filter(r => r !== null);

        return NextResponse.json({ 
            success: true, 
            event,
            updatedClans: validResults,
            message: `Event scores submitted and clan points updated`
        });
    } catch (error) {
        console.error('Event scoring error:', error);
        return NextResponse.json({ error: 'Failed to submit event scores' }, { status: 500 });
    }
}
