import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        await dbConnect();
        const rooms = await Room.find().sort({ name: 1 });
        return NextResponse.json(rooms);
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

        const room = await Room.create({
            ...body,
            isAvailable: true
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error('Room creation error:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
