import { NextResponse } from 'next/server';
import { getRoleFromRUData, lookupRUUser } from '@/lib/ru-data-mapper';

export async function GET(request, { params }) {
  try {
    const { email } = await params;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const decodedEmail = decodeURIComponent(email);
    const ruUser = lookupRUUser(decodedEmail);
    const role = getRoleFromRUData(decodedEmail);

    if (!role) {
      console.log(`[RU-Users API] No role found for email: ${decodedEmail}`);
      return NextResponse.json({ role: null, found: false }, { status: 200 });
    }

    console.log(`[RU-Users API] Found role ${role} for email: ${decodedEmail}, userType: ${ruUser?.userType}`);
    return NextResponse.json({ role, found: true, userType: ruUser?.userType }, { status: 200 });
  } catch (error) {
    console.error('Error fetching RU user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}
