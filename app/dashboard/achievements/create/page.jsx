'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateAchievementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [clans, setClans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Academic',
        date: '',
        eventId: '',
        clubId: '',
        clanId: '',
        pointsAwarded: 0,
        participants: [],
    });
    const [newParticipant, setNewParticipant] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [eventsRes, clubsRes, clansRes] = await Promise.all([
                fetch('/api/events'),
                fetch('/api/clubs'),
                fetch('/api/clans'),
            ]);

            if (eventsRes.ok) setEvents(await eventsRes.json());
            if (clubsRes.ok) setClubs(await clubsRes.json());
            if (clansRes.ok) setClans(await clansRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    eventId: formData.eventId || undefined,
                    clubId: formData.clubId || undefined,
                    clanId: formData.clanId || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error('Failed to create achievement', {
                    description: error.error || 'Please check your inputs and try again.',
                });
                return;
            }

            toast.success('Achievement created!', {
                description: 'The achievement has been recorded successfully.',
            });
            router.push('/dashboard/achievements');
        } catch (error) {
            console.error('Error creating achievement:', error);
            toast.error('Failed to create achievement', {
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const addParticipant = () => {
        if (!newParticipant.trim()) return;
        setFormData({
            ...formData,
            participants: [...formData.participants, newParticipant.trim()],
        });
        setNewParticipant('');
    };

    const removeParticipant = (index) => {
        setFormData({
            ...formData,
            participants: formData.participants.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/achievements">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Achievement</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Record a new achievement for clubs or clans
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Achievement Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., First Place in Hackathon"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the achievement"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="category">Category *</Label>
                                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Academic">Academic</SelectItem>
                                                <SelectItem value="Sports">Sports</SelectItem>
                                                <SelectItem value="Cultural">Cultural</SelectItem>
                                                <SelectItem value="Technical">Technical</SelectItem>
                                                <SelectItem value="Social">Social</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="pointsAwarded">Points Awarded</Label>
                                    <Input
                                        id="pointsAwarded"
                                        type="number"
                                        min="0"
                                        value={formData.pointsAwarded}
                                        onChange={(e) => setFormData({ ...formData, pointsAwarded: parseInt(e.target.value) || 0 })}
                                        placeholder="Points for clan leaderboard"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Participants */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Participants</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.participants.map((participant, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                        <span className="flex-1">{participant}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeParticipant(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Participant name"
                                        value={newParticipant}
                                        onChange={(e) => setNewParticipant(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                                    />
                                    <Button type="button" onClick={addParticipant}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Links</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="eventId">Related Event</Label>
                                    <Select value={formData.eventId} onValueChange={(value) => setFormData({ ...formData, eventId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map((event) => (
                                                <SelectItem key={event._id} value={event._id}>
                                                    {event.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="clubId">Club</Label>
                                    <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select club" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clubs.map((club) => (
                                                <SelectItem key={club._id} value={club._id}>
                                                    {club.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="clanId">Clan</Label>
                                    <Select value={formData.clanId} onValueChange={(value) => setFormData({ ...formData, clanId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select clan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clans.map((clan) => (
                                                <SelectItem key={clan._id} value={clan._id}>
                                                    {clan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Creating...' : 'Create Achievement'}
                            </Button>
                            <Link href="/dashboard/achievements">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
