import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import File from '@/models/File';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const clubId = searchParams.get('clubId');
        const tag = searchParams.get('tag');

        const filter = {};
        if (eventId) filter.eventId = eventId;
        if (clubId) filter.clubId = clubId;
        if (tag) filter.tags = tag;

        const files = await File.find(filter)
            .sort({ uploadedAt: -1 })
            .populate('eventId', 'title type')
            .populate('clubId', 'name')
            .populate('uploadedBy', 'name email')
            .lean();

        const formattedFiles = files.map(file => ({
            ...file,
            _id: file._id.toString(),
        }));

        return NextResponse.json(formattedFiles);
    } catch (error) {
        console.error('Files API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const {
            fileName,
            filePath,
            fileType,
            fileSize,
            description,
            eventId,
            clubId,
            semester,
            tags,
        } = body;

        if (!fileName || !filePath || !fileType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const file = await File.create({
            fileName,
            filePath,
            fileType,
            fileSize: fileSize || 0,
            description: description || '',
            eventId: eventId || null,
            clubId: clubId || null,
            semester: semester || null,
            tags: tags || [],
            uploadedBy: session.user.id,
        });

        const populatedFile = await File.findById(file._id)
            .populate('eventId', 'title type')
            .populate('clubId', 'name')
            .populate('uploadedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...populatedFile,
            _id: populatedFile._id.toString(),
        }, { status: 201 });
    } catch (error) {
        console.error('File creation error:', error);
        return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 });
    }
}
