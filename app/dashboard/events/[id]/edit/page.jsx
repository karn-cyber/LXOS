'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const eventSchema = z.object({
    name: z.string().min(1, 'Event name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    date: z.string().min(1, 'Date is required'),
    location: z.string().min(1, 'Location is required'),
    expectedParticipants: z.coerce.number().min(1, 'Expected participants must be at least 1'),
    budgetRequested: z.coerce.number().min(0, 'Budget must be a positive number'),
    eventType: z.string().min(1, 'Event type is required'),
});

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [event, setEvent] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            name: '',
            description: '',
            date: '',
            location: '',
            expectedParticipants: 0,
            budgetRequested: 0,
            eventType: '',
        },
    });

    const fetchEvent = useCallback(async () => {
        try {
            const response = await fetch(`/api/events/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch event');
            }
            const data = await response.json();
            setEvent(data);
            
            // Format date for input
            const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
            
            // Set form values
            form.reset({
                name: data.name,
                description: data.description,
                date: formattedDate,
                location: data.location,
                expectedParticipants: data.expectedParticipants,
                budgetRequested: data.budgetRequested,
                eventType: data.eventType,
            });
        } catch (error) {
            console.error('Error fetching event:', error);
            toast.error('Failed to fetch event details');
            router.push('/dashboard/events');
        } finally {
            setFetchLoading(false);
        }
    }, [params.id, form, router]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
            return;
        }

        const userRole = session?.user?.role;
        const canEdit = hasPermission(userRole, PERMISSIONS.EDIT_EVENT) || 
                       hasPermission(userRole, PERMISSIONS.CREATE_EVENT);
        
        if (!canEdit) {
            toast.error('You do not have permission to edit events');
            router.push('/dashboard/events');
            return;
        }

        fetchEvent();
    }, [session, status, router, params.id, fetchEvent]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update event');
            }

            const result = await response.json();
            toast.success(result.message || 'Event updated successfully!');
            router.push(`/dashboard/events/${params.id}`);
        } catch (error) {
            console.error('Error updating event:', error);
            toast.error(error.message || 'Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/events/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete event');
            }

            const result = await response.json();
            toast.success(result.message || 'Event deleted successfully!');
            router.push('/dashboard/events');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error(error.message || 'Failed to delete event');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (status === 'loading' || fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">Event not found</p>
                    <Link href="/dashboard/events">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Events
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/events/${params.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
                        <p className="text-gray-600">Update event information and settings</p>
                    </div>
                </div>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={deleteLoading}
                    className="ml-4"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLoading ? 'Deleting...' : 'Delete Event'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                    <CardDescription>
                        Update the event details and settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Tech Hackathon 2024" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eventType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select event type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Workshop">Workshop</SelectItem>
                                                    <SelectItem value="Seminar">Seminar</SelectItem>
                                                    <SelectItem value="Competition">Competition</SelectItem>
                                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                                    <SelectItem value="Sports">Sports</SelectItem>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Main Auditorium" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="expectedParticipants"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expected Participants</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="100" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="budgetRequested"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Budget Requested (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="25000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detailed description of the event..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="outline" onClick={() => router.back()} className="mr-4">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Updating...' : 'Update Event'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
