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

const roomSchema = z.object({
    name: z.string().min(1, 'Room name is required'),
    type: z.string().min(1, 'Type is required'),
    capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
    location: z.string().min(1, 'Location is required'),
    facilities: z.string().optional(),
    isActive: z.boolean().optional(),
});

export default function EditRoomPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [room, setRoom] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: '',
            type: '',
            capacity: 0,
            location: '',
            facilities: '',
            isActive: true,
        },
    });

    const fetchRoom = useCallback(async () => {
        try {
            const response = await fetch(`/api/rooms/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch room');
            }
            const data = await response.json();
            setRoom(data);
            
            // Set form values
            form.reset({
                name: data.name,
                type: data.type,
                capacity: data.capacity,
                location: data.location,
                facilities: data.facilities || '',
                isActive: data.isActive !== false,
            });
        } catch (error) {
            console.error('Error fetching room:', error);
            toast.error('Failed to fetch room details');
            router.push('/dashboard/rooms');
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
        const canEdit = hasPermission(userRole, PERMISSIONS.EDIT_ROOM) || 
                       hasPermission(userRole, PERMISSIONS.CREATE_ROOM);
        
        if (!canEdit) {
            toast.error('You do not have permission to edit rooms');
            router.push('/dashboard/rooms');
            return;
        }

        fetchRoom();
    }, [session, status, router, params.id, fetchRoom]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/rooms/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update room');
            }

            const result = await response.json();
            toast.success(result.message || 'Room updated successfully!');
            router.push('/dashboard/rooms');
        } catch (error) {
            console.error('Error updating room:', error);
            toast.error(error.message || 'Failed to update room');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/rooms/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete room');
            }

            const result = await response.json();
            toast.success(result.message || 'Room deleted successfully!');
            router.push('/dashboard/rooms');
        } catch (error) {
            console.error('Error deleting room:', error);
            toast.error(error.message || 'Failed to delete room');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (status === 'loading' || fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading room details...</p>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">Room not found</p>
                    <Link href="/dashboard/rooms">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Rooms
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
                    <Link href="/dashboard/rooms">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Room</h1>
                        <p className="text-gray-600">Update room information and settings</p>
                    </div>
                </div>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={deleteLoading}
                    className="ml-4"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLoading ? 'Deleting...' : 'Delete Room'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Room Information</CardTitle>
                    <CardDescription>
                        Update the room details and specifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Room Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Auditorium A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Classroom">Classroom</SelectItem>
                                                    <SelectItem value="Auditorium">Auditorium</SelectItem>
                                                    <SelectItem value="Lab">Lab</SelectItem>
                                                    <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                                                    <SelectItem value="Open Space">Open Space</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capacity</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="50" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Block B, 2nd Floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="facilities"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facilities</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="List available facilities (e.g. Projector, Air Conditioning, Audio System)"
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
                                    {loading ? 'Updating...' : 'Update Room'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
