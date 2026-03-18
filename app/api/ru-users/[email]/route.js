import { NextResponse } from 'next/server';
import { getRoleFromRUData } from '@/lib/ru-data-mapper';

export async function GET(request, { params }) {
  try {
    const { email } = await params;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const role = getRoleFromRUData(decodeURIComponent(email));

    if (!role) {
      return NextResponse.json({ role: null, found: false }, { status: 200 });
    }

    return NextResponse.json({ role, found: true }, { status: 200 });
  } catch (error) {
    console.error('Error fetching RU user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}
