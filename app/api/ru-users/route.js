import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import { searchRUUsers } from '@/lib/ru-data-mapper';

// Search RU users (name/email) for the access-management picker. Admin only.
export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';
        return NextResponse.json(searchRUUsers(q, 25));
    } catch (error) {
        console.error('RU users search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
