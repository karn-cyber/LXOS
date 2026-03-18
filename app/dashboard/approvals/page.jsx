import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Approval from '@/models/Approval';
import Event from '@/models/Event';
import Expense from '@/models/Expense';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Make sure models are registered for populate
import '@/models/Event';
import '@/models/Expense';
import '@/models/Booking';
import '@/models/Club';
import '@/models/Clan';

async function getPendingApprovals() {
    await dbConnect();

    const approvals = await Approval.find({ status: 'PENDING' })
        .sort({ priority: -1, createdAt: 1 })
        .populate('requestedBy', 'name email')
        .populate('entityId') // Populate the entity based on entityModel
        .lean();

    // Format the approvals
    const enrichedApprovals = approvals.map((approval) => {
        // Safe entity mapping
        const entity = approval.entityId ? {
            ...approval.entityId,
            _id: approval.entityId._id?.toString(),
        } : null;

        return {
            ...approval,
            _id: approval._id.toString(),
            entity,
            requestedBy: approval.requestedBy ? {
                ...approval.requestedBy,
                _id: approval.requestedBy._id.toString()
            } : null,
        };
    });

    return enrichedApprovals;
}



export default async function ApprovalsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    // Only admin, LX team, and finance can access
    if (!['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) {
        redirect('/dashboard');
    }

    const approvals = await getPendingApprovals();

    // Filter based on role
    const filteredApprovals = approvals.filter(approval => {
        if (session.user.role === 'ADMIN') return true;
        if (session.user.role === 'LX_TEAM' && approval.type === 'EVENT') return true;
        if (session.user.role === 'FINANCE' && approval.type === 'EXPENSE') return true;
        return false;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Approvals Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Manage pending approval requests
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredApprovals.length}</div>
                        <p className="text-xs text-zinc-500 mt-1">Awaiting your review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredApprovals.filter(a => a.priority === 'HIGH').length}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Urgent requests</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredApprovals.filter(a => {
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return new Date(a.createdAt) > weekAgo;
                            }).length}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Recent requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Approvals List */}
            {filteredApprovals.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-center">
                            All caught up! No pending approvals.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredApprovals.map((approval) => (
                                <div
                                    key={approval._id}
                                    className="flex items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    {/* Priority Indicator */}
                                    <div className={`h-10 w-1 rounded-lg ${approval.priority === 'HIGH' ? 'bg-red-500' :
                                        approval.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline">{approval.type}</Badge>
                                            {approval.priority === 'HIGH' && (
                                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                            )}
                                        </div>
                                        <h3 className="font-semibold truncate">
                                            {approval.entity?.title || `${approval.type} Approval`}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                                            <span>By {approval.requestedBy?.name}</span>
                                            <span>•</span>
                                            <span>{new Date(approval.createdAt).toLocaleDateString()}</span>
                                            {approval.entity?.amount && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium">₹{approval.entity.amount.toLocaleString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center">
                                        {approval.entity?._id ? (
                                            <Link href={
                                                approval.entityModel === 'Event' || approval.type === 'EVENT' || approval.type === 'BOOKING'
                                                    ? `/dashboard/events/${approval.entity._id}`
                                                    : approval.entityModel === 'Expense' || approval.type === 'EXPENSE'
                                                        ? `/dashboard/expenses/${approval.entity._id}`
                                                        : `/dashboard/approvals`
                                            }>
                                                <Button size="sm">Review</Button>
                                            </Link>
                                        ) : (
                                            <Button size="sm" variant="outline" disabled>
                                                Details Missing
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
