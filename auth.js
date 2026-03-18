import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from './lib/db';
import User from './models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim()?.toLowerCase();
                const password = credentials?.password;

                // Expected auth failure: missing credentials
                if (!email || !password) {
                    return null;
                }

                try {
                    await dbConnect();

                    // Find user with password field
                    const user = await User.findOne({ email })
                        .select('+password')
                        .populate('clubId', 'name')
                        .populate('clanId', 'name');

                    // Expected auth failure: invalid email or password
                    if (!user) {
                        return null;
                    }

                    // Expected auth failure: inactive account
                    if (!user.isActive) {
                        return null;
                    }

                    // Verify password
                    const isPasswordValid = await user.comparePassword(password);

                    // Expected auth failure: invalid email or password
                    if (!isPasswordValid) {
                        return null;
                    }

                    // Return user object
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        clubId: user.clubId?._id?.toString() || null,
                        clubName: user.clubId?.name || null,
                        clanId: user.clanId?._id?.toString() || null,
                        clanName: user.clanId?.name || null,
                    };
                } catch (error) {
                    // Unexpected operational failure only
                    console.error('Authentication service error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.clubId = user.clubId;
                token.clubName = user.clubName;
                token.clanId = user.clanId;
                token.clanName = user.clanName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.clubId = token.clubId;
                session.user.clubName = token.clubName;
                session.user.clanId = token.clanId;
                session.user.clanName = token.clanName;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV === 'development',
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
});
