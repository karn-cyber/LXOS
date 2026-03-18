import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';
import Event from '@/models/Event';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import ClanDetailView from '@/components/clans/clan-detail-view';

async function getClanWithDetails(id, userId, userRole, userClanId) {
    try {
        await dbConnect();

        // Authorization check
        if (userRole === 'CLAN_HEAD' && userClanId !== id) {
            return null; // Unauthorized
        }

        const clan = await Clan.findById(id).lean();
        if (!clan) {
            return null;
        }

        // Get clan events
        const events = await Event.find({ clanId: id })
            .sort({ createdAt: -1 })
            .lean();

        // Deep serialization helper for Mongo objects
        const serialize = (obj) => {
            if (!obj) return null;
            return JSON.parse(JSON.stringify(obj));
        };

        return {
            clan: serialize(clan),
            events: serialize(events),
        };
    } catch (error) {
        console.warn('Database connection failed, using mock clan data:', error.message);

        // Mock data for development
        const mockClans = {
            '507f1f77bcf86cd799439011': {
                name: 'Maratha',
                color: 'bg-orange-500',
                points: 2450,
                budgetAllocated: 50000,
                budgetSpent: 35000,
                semester: 'Spring 2026',
                description: 'The warrior clan known for strength and valor'
            },
            '507f1f77bcf86cd799439012': {
                name: 'Vijaya',
                color: 'bg-blue-500',
                points: 2200,
                budgetAllocated: 45000,
                budgetSpent: 28000,
                semester: 'Spring 2026',
                description: 'The victorious clan with a legacy of success'
            },
            '507f1f77bcf86cd799439013': {
                name: 'Chola',
                color: 'bg-green-500',
                points: 1980,
                budgetAllocated: 40000,
                budgetSpent: 22000,
                semester: 'Spring 2026',
                description: 'The maritime clan with rich cultural heritage'
            },
            '507f1f77bcf86cd799439014': {
                name: 'Rajputana',
                color: 'bg-purple-500',
                points: 1850,
                budgetAllocated: 42000,
                budgetSpent: 31000,
                semester: 'Spring 2026',
                description: 'The royal clan known for honor and chivalry'
            }
        };

        const mockEvents = [
            {
                _id: 'event1',
                title: 'Annual Sports Meet',
                description: 'Inter-clan sports competition with multiple events',
                type: 'CLAN',
                clanId: id,
                date: '2024-03-15',
                location: 'Main Sports Complex',
                expectedParticipants: 150,
                budgetRequested: 15000,
                budgetApproved: 12000,
                budgetSpent: 11500,
                approvalStatus: 'APPROVED',
                isCompleted: true,
                clanScores: {
                    'Maratha': 85,
                    'Vijaya': 78,
                    'Chola': 72,
                    'Rajputana': 65
                }
            },
            {
                _id: 'event2',
                title: 'Cultural Festival',
                description: 'Showcase of clan traditions and cultural performances',
                type: 'CLAN',
                clanId: id,
                date: '2024-04-20',
                location: 'Auditorium',
                expectedParticipants: 200,
                budgetRequested: 20000,
                budgetApproved: 18000,
                budgetSpent: 0,
                approvalStatus: 'APPROVED',
                isCompleted: false
            }
        ];

        const mockClan = mockClans[id];
        if (!mockClan) return null;

        return {
            clan: { ...mockClan, _id: id },
            events: mockEvents
        };
    }
}

export default async function ClanDetailPage({ params }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const { id } = await params;
    const { user } = session;

    // Check if user has permission to view clans
    const canViewClans = hasPermission(user.role, PERMISSIONS.MANAGE_CLANS) ||
        hasPermission(user.role, PERMISSIONS.VIEW_OWN_CLAN);

    if (!canViewClans) {
        redirect('/dashboard');
    }

    const data = await getClanWithDetails(id, user.id, user.role, user.clanId);

    if (!data) {
        notFound();
    }

    const { clan, events } = data;

    return (
        <ClanDetailView
            clan={clan}
            events={events}
            user={user}
            isAdmin={user.role === 'ADMIN'}
            isClanLeader={user.role === 'CLAN_HEAD' && user.clanId === id}
        />
    );
}

export async function generateStaticParams() {
    try {
        await dbConnect();
        const clans = await Clan.find().select('_id').lean();

        return clans.map((clan) => ({
            id: clan._id.toString(),
        }));
    } catch (error) {
        console.warn('Could not generate static params for clans:', error.message);
        // Return empty array if database is not available during build
        return [];
    }
}
