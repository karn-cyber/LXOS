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

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clubs, setClubs] = useState([]);
    const [clans, setClans] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'CLUB',
        clubId: '',
        clanId: '',
        startDate: '',
        endDate: '',
        roomId: '',
        budgetAllocated: 0,
        attendees: 0,
        requirements: [],
    });
    const [newRequirement, setNewRequirement] = useState({ item: '', quantity: 1, estimatedCost: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clubsRes, clansRes, roomsRes] = await Promise.all([
                fetch('/api/clubs'),
                fetch('/api/clans'),
                fetch('/api/rooms'),
            ]);

            if (clubsRes.ok) setClubs(await clubsRes.json());
            if (clansRes.ok) setClans(await clansRes.json());
            if (roomsRes.ok) setRooms(await roomsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    clubId: formData.type === 'CLUB' ? formData.clubId : undefined,
                    clanId: formData.type === 'CLAN' ? formData.clanId : undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error('Failed to create event', {
                    description: error.error || 'Something went wrong. Please try again.',
                });
                return;
            }

            const event = await response.json();
            toast.success('Event created successfully!', {
                description: 'Your event has been submitted and is awaiting approval.',
            });
            router.push(`/dashboard/events/${event._id}`);
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Failed to create event', {
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const addRequirement = () => {
        if (!newRequirement.item) return;
        setFormData({
            ...formData,
            requirements: [...formData.requirements, { ...newRequirement }],
        });
        setNewRequirement({ item: '', quantity: 1, estimatedCost: 0 });
    };

    const removeRequirement = (index) => {
        setFormData({
            ...formData,
            requirements: formData.requirements.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/events">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Create a new event for your club, clan, or LX
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Event Title *</Label>
                                    <Input
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter event title"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe your event"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="startDate">Start Date & Time *</Label>
                                        <Input
                                            id="startDate"
                                            type="datetime-local"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="endDate">End Date & Time *</Label>
                                        <Input
                                            id="endDate"
                                            type="datetime-local"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="budgetAllocated">Budget Allocated (₹)</Label>
                                        <Input
                                            id="budgetAllocated"
                                            type="number"
                                            min="0"
                                            value={formData.budgetAllocated}
                                            onChange={(e) => setFormData({ ...formData, budgetAllocated: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="attendees">Expected Attendees</Label>
                                        <Input
                                            id="attendees"
                                            type="number"
                                            min="0"
                                            value={formData.attendees}
                                            onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Requirements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.requirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{req.item}</p>
                                            <p className="text-sm text-zinc-500">
                                                Qty: {req.quantity} • Est. Cost: ₹{req.estimatedCost.toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRequirement(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="grid gap-3 md:grid-cols-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            placeholder="Item name"
                                            value={newRequirement.item}
                                            onChange={(e) => setNewRequirement({ ...newRequirement, item: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            value={newRequirement.quantity}
                                            onChange={(e) => setNewRequirement({ ...newRequirement, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            placeholder="Cost"
                                            min="0"
                                            value={newRequirement.estimatedCost}
                                            onChange={(e) => setNewRequirement({ ...newRequirement, estimatedCost: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <Button type="button" variant="outline" onClick={addRequirement} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Requirement
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Type</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="type">Type *</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, clubId: '', clanId: '' })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CLUB">Club Event</SelectItem>
                                            <SelectItem value="CLAN">Clan Event</SelectItem>
                                            <SelectItem value="LX">LX Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.type === 'CLUB' && (
                                    <div>
                                        <Label htmlFor="clubId">Club *</Label>
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
                                )}

                                {formData.type === 'CLAN' && (
                                    <div>
                                        <Label htmlFor="clanId">Clan *</Label>
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
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Room Booking</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <Label htmlFor="roomId">Room (Optional)</Label>
                                    <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select room" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rooms.map((room) => (
                                                <SelectItem key={room._id} value={room._id}>
                                                    {room.name} ({room.capacity} capacity)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Creating...' : 'Create Event'}
                            </Button>
                            <Link href="/dashboard/events">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
