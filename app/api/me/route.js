import { NextResponse } from 'next/server';
import { getDashboardSession } from '@/lib/dashboard-session';

// Current signed-in user (works for both Clerk and Rishiverse SSO sessions).
// Used by the sidebar so the role/name is correct regardless of login method.
export async function GET() {
    try {
        const session = await getDashboardSession();
        if (!session) return NextResponse.json({ user: null }, { status: 200 });
        return NextResponse.json({
            user: {
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
            },
        });
    } catch {
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
