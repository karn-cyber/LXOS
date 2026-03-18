import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Event from '@/models/Event';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const clubs = await Club.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        const formattedClubs = clubs.map(club => ({
            ...club,
            _id: club._id.toString(),
        }));

        return NextResponse.json(formattedClubs);
    } catch (error) {
        console.error('Clubs API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admin can create clubs
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const body = await request.json();
        const { name, description, category, budgetAllocated } = body;

        if (!name || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const club = await Club.create({
            name,
            description: description || '',
            category,
            budgetAllocated: budgetAllocated || 0,
            budgetSpent: 0,
            isActive: true,
        });

        return NextResponse.json({
            ...club.toObject(),
            _id: club._id.toString(),
        }, { status: 201 });
    } catch (error) {
        console.error('Club creation error:', error);
        return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
    }
}
