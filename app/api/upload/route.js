import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        // Auth check
        let userId = null;
        try {
            const session = await auth();
            userId = session?.userId ?? null;
        } catch {
            // ignore clerk errors
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        let formData;
        try {
            formData = await request.formData();
        } catch (err) {
            return NextResponse.json({ error: 'Failed to parse form data: ' + err.message }, { status: 400 });
        }

        const file = formData.get('file');
        const uploadPath = formData.get('path') || 'general';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Build unique filename
        const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Save to public/uploads/<path>/
        const uploadDir = join(process.cwd(), 'public', 'uploads', uploadPath);
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, uniqueName), buffer);

        const publicUrl = `/uploads/${uploadPath}/${uniqueName}`;
        return NextResponse.json({ url: publicUrl, success: true });
    } catch (error) {
        console.error('[upload] error:', error);
        return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
    }
}
