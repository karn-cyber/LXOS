import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

async function getAllUpdates() {
    await dbConnect();

    const updates = await Achievement.find({})
        .sort({ achievedDate: -1 })
        .limit(50)
        .populate('clubId', 'name category')
        .populate('clanId', 'name color')
        .populate('createdBy', 'name')
        .lean();

    return updates.map(u => ({
        ...u,
        _id: u._id.toString(),
        eventId: u.eventId?.toString(),
        clubId: u.clubId ? {
            _id: u.clubId._id.toString(),
            name: u.clubId.name,
            category: u.clubId.category,
        } : null,
        clanId: u.clanId ? {
            _id: u.clanId._id.toString(),
            name: u.clanId.name,
            color: u.clanId.color,
        } : null,
        createdBy: u.createdBy ? {
            _id: u.createdBy._id.toString(),
            name: u.createdBy.name,
        } : null,
    }));
}

export default async function FeedPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const updates = await getAllUpdates();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">LX Feed</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Latest updates and achievements from all clubs and clans
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
                        <Trophy className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{updates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clubs Active</CardTitle>
                        <Users className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(updates.filter(u => u.clubId).map(u => u.clubId._id)).size}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clans Active</CardTitle>
                        <Users className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(updates.filter(u => u.clanId).map(u => u.clanId._id)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feed */}
            <div className="space-y-6">
                {updates.length === 0 ? (
                    <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-zinc-500">
                            <Trophy className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No updates yet</p>
                            <p className="text-sm">Be the first to share an achievement!</p>
                        </CardContent>
                    </Card>
                ) : (
                    updates.map((update) => (
                        <Card key={update._id} className="overflow-hidden hover:shadow-md transition-shadow">
                            {/* Image */}
                            {update.images && update.images.length > 0 && (
                                <div className="relative w-full h-96 bg-zinc-100 dark:bg-zinc-900">
                                    <Image
                                        src={update.images[0]}
                                        alt={update.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {update.clubId && (
                                                <Link href={`/dashboard/clubs/${update.clubId._id}`}>
                                                    <Badge variant="outline" className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                        {update.clubId.name}
                                                    </Badge>
                                                </Link>
                                            )}
                                            {update.clanId && (
                                                <Badge
                                                    style={{
                                                        backgroundColor: `${update.clanId.color}20`,
                                                        color: update.clanId.color,
                                                        borderColor: update.clanId.color
                                                    }}
                                                >
                                                    {update.clanId.name}
                                                </Badge>
                                            )}
                                            <Badge variant="secondary">{update.category}</Badge>
                                        </div>
                                        <CardTitle className="text-2xl leading-tight">{update.title}</CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(update.achievedDate).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            {update.createdBy && (
                                                <>
                                                    <span>•</span>
                                                    <span>By {update.createdBy.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {update.points > 0 && (
                                        <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                                            <Trophy className="h-4 w-4" />
                                            {update.points} pts
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {update.description}
                                </p>
                                {update.participants && update.participants.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium text-zinc-500 mb-2">Participants:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {update.participants.map((participant, idx) => (
                                                <Badge key={idx} variant="outline">{participant}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
