import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
    try {
        // Auth check — app uses Clerk; any signed-in user may upload.
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

        let formData;
        try {
            formData = await request.formData();
        } catch (err) {
            return NextResponse.json({ error: 'Failed to parse form data: ' + err.message }, { status: 400 });
        }

        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 });
        }

        // Files are stored in MongoDB as inline data URLs (filePath field).
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mimeType = file.type || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({ url: dataUrl, success: true });
    } catch (error) {
        console.error('[upload] error:', error);
        return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
    }
}
