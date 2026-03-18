import { auth } from './auth';
import { NextResponse } from 'next/server';

// Force Node.js runtime to support bcrypt/crypto
export const runtime = 'nodejs';

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;

    // Public routes
    const publicRoutes = ['/', '/login'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // If not logged in and trying to access protected route
    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // If logged in and trying to access login page
    if (isLoggedIn && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
