import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        await dbConnect();
        const clans = await Clan.find().sort({ points: -1 });
        return NextResponse.json(clans);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const body = await request.json();

        const clan = await Clan.create({
            ...body,
            points: 0,
            budgetSpent: 0
        });

        return NextResponse.json(clan, { status: 201 });
    } catch (error) {
        console.error('Clan creation error:', error);
        return NextResponse.json({ error: 'Failed to create clan' }, { status: 500 });
    }
}
