import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

// Use service role key to bypass RLS if available, otherwise fallback to anon key
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.trim().replace(/\/$/, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const bucketName = (process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'lx-storage').trim();

export async function POST(request) {
    console.log('Upload API: Request received');

    // Validate URL format
    if (supabaseUrl.includes('supabase.com') && !supabaseUrl.includes('.supabase.co')) {
        console.error('Upload API: CRITICAL ERROR - Your NEXT_PUBLIC_SUPABASE_URL looks like a Dashboard URL (supabase.com). It MUST be an API URL (typically https://xyz.supabase.co). Please check your .env.local');
        return NextResponse.json({
            error: 'Invalid Supabase URL. Please use the "Project URL" from Settings > API in your Dashboard, not the dashboard browser URL.'
        }, { status: 500 });
    }

    console.log('Upload API: Using URL:', supabaseUrl.substring(0, 25) + '...');
    try {
        const session = await auth();
        if (!session) {
            console.log('Upload API: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Upload API: Session found for', session.user.email);

        let formData;
        try {
            formData = await request.formData();
        } catch (err) {
            console.error('Upload API: Failed to parse form data', err);
            return NextResponse.json({ error: 'Failed to process form data: ' + err.message }, { status: 400 });
        }

        const file = formData.get('file');
        const path = formData.get('path') || 'general';

        if (!file) {
            console.log('Upload API: No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`Upload API: Processing file "${file.name}" (${file.size} bytes) for path "${path}"`);

        if (!supabaseUrl || !supabaseKey) {
            console.error('Upload API: Missing Supabase credentials');
            return NextResponse.json({ error: 'Storage configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const bytes = await file.arrayBuffer();
        const blob = new Blob([bytes], { type: file.type });

        // Create a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        console.log(`Upload API: Using bucket "${bucketName}". Path: "${filePath}"`);

        // Check bucket existence first (optional but helps debug)
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.error('Upload API: Bucket list error:', bucketError);
        } else {
            const bucketExists = buckets.find(b => b.name === bucketName);
            if (!bucketExists) {
                console.warn(`Upload API: Bucket "${bucketName}" not found! Available buckets:`, buckets.map(b => b.name).join(', '));
                return NextResponse.json({ error: `Bucket "${bucketName}" not found in Supabase. Please create it or check your .env.` }, { status: 500 });
            }
        }

        console.log('Upload API: Starting Supabase upload...');

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, blob, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload API: Supabase error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        console.log('Upload API: Success! URL:', publicUrl);
        return NextResponse.json({ url: publicUrl, success: true });
    } catch (error) {
        console.error('Upload API: Critical failure:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
