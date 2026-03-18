import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Clan from '@/models/Clan';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const clubId = searchParams.get('clubId');
        const clanId = searchParams.get('clanId');

        const filter = {};
        if (category) filter.category = category;
        if (clubId) filter.clubId = clubId;
        if (clanId) filter.clanId = clanId;

        const achievements = await Achievement.find(filter)
            .sort({ date: -1 })
            .populate('eventId', 'title type')
            .populate('clubId', 'name category')
            .populate('clanId', 'name color')
            .lean();

        const formattedAchievements = achievements.map(achievement => ({
            ...achievement,
            _id: achievement._id.toString(),
        }));

        return NextResponse.json(formattedAchievements);
    } catch (error) {
        console.error('Achievements API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admin, LX team, Club Heads, and Clan Heads can create achievements
        if (session.user.role !== 'ADMIN' && session.user.role !== 'LX_TEAM' && session.user.role !== 'CLUB_HEAD' && session.user.role !== 'CLAN_HEAD') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const body = await request.json();
        const {
            title,
            description,
            category,
            date,
            eventId,
            clubId,
            clanId,
            pointsAwarded,
            participants,
            images,
        } = body;

        if (!title || !description || !category || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const achievement = await Achievement.create({
            title,
            description,
            category,
            achievedDate: new Date(date),
            eventId: eventId || null,
            clubId: clubId || null,
            clanId: clanId || null,
            points: pointsAwarded || 0,
            participants: participants || [],
            images: images || [],
            createdBy: session.user.id,
            semester: body.semester || 'Spring 2026',
        });

        // Update clan points if points awarded and clan specified
        if (clanId && pointsAwarded > 0) {
            await Clan.findByIdAndUpdate(clanId, {
                $inc: { points: pointsAwarded },
            });
        }

        const populatedAchievement = await Achievement.findById(achievement._id)
            .populate('eventId', 'title type')
            .populate('clubId', 'name category')
            .populate('clanId', 'name color')
            .lean();

        return NextResponse.json({
            ...populatedAchievement,
            _id: populatedAchievement._id.toString(),
        }, { status: 201 });
    } catch (error) {
        console.error('Achievement creation error:', error);
        return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
    }
}
