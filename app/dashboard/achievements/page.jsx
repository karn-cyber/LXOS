import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trophy, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

async function getAchievements(session) {
    await dbConnect();

    const filter = session?.user?.role === 'ADMIN' ? {} : { status: 'APPROVED' };

    const achievements = await Achievement.find(filter)
        .sort({ achievedDate: -1 })
        .populate('eventId', 'title type')
        .populate('clubId', 'name category')
        .populate('clanId', 'name color')
        .lean();

    return achievements.map(achievement => ({
        ...achievement,
        _id: achievement._id.toString(),
        eventId: achievement.eventId ? { ...achievement.eventId, _id: achievement.eventId._id.toString() } : null,
        clubId: achievement.clubId ? { ...achievement.clubId, _id: achievement.clubId._id.toString() } : null,
        clanId: achievement.clanId ? { ...achievement.clanId, _id: achievement.clanId._id.toString() } : null,
    }));
}

export default async function AchievementsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const achievements = await getAchievements(session);
    const canCreate = ['ADMIN', 'LX_TEAM'].includes(session.user.role);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Repository of all club and clan achievements
                    </p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/achievements/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Achievement
                        </Button>
                    </Link>
                )}
            </div>

            {/* Achievements Grid */}
            {achievements.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Trophy className="h-12 w-12 text-zinc-400 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-4">
                            No achievements recorded yet. Add your first achievement to get started.
                        </p>
                        {canCreate && (
                            <Link href="/dashboard/achievements/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Achievement
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {achievements.map((achievement) => (
                        <Card key={achievement._id} className="h-full hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center shrink-0">
                                        <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg leading-tight">{achievement.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">{achievement.category}</Badge>
                                            {achievement.pointsAwarded > 0 && (
                                                <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
                                                    +{achievement.pointsAwarded} pts
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                    {achievement.description}
                                </p>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(achievement.date).toLocaleDateString()}</span>
                                </div>

                                {/* Organization */}
                                {achievement.clubId && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-zinc-500" />
                                        <span className="font-medium">{achievement.clubId.name}</span>
                                    </div>
                                )}
                                {achievement.clanId && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div
                                            className="h-3 w-3 rounded-lg"
                                            style={{ backgroundColor: achievement.clanId.color }}
                                        />
                                        <span className="font-medium">{achievement.clanId.name}</span>
                                    </div>
                                )}

                                {/* Event Link */}
                                {achievement.eventId && (
                                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <p className="text-xs text-zinc-500">Related Event</p>
                                        <Link
                                            href={`/dashboard/events/${achievement.eventId._id}`}
                                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {achievement.eventId.title}
                                        </Link>
                                    </div>
                                )}

                                {/* Participants */}
                                {achievement.participants && achievement.participants.length > 0 && (
                                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <p className="text-xs text-zinc-500 mb-1">Participants</p>
                                        <div className="flex flex-wrap gap-1">
                                            {achievement.participants.slice(0, 3).map((participant, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {participant}
                                                </Badge>
                                            ))}
                                            {achievement.participants.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{achievement.participants.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons for authorized users */}
                                {canCreate && (
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                        <Link href={`/dashboard/achievements/${achievement._id}/edit`} className="block">
                                            <Button variant="outline" size="sm" className="w-full">
                                                View/Edit Details
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
