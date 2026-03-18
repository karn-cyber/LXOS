import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { email } = params;

    const user = await User.findOne({ email: email.toLowerCase() }).select('role').lean();

    if (!user) {
      return NextResponse.json({ role: 'GUEST' }, { status: 200 });
    }

    return NextResponse.json({ role: user.role }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ role: 'GUEST', error: 'Failed to fetch user role' }, { status: 500 });
  }
}
