'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Users, Wifi, Loader2 } from 'lucide-react';

const roomSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.string().min(1, 'Room type is required'),
    capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
    location: z.string().min(3, 'Location is required'),
    facilities: z.string().optional(), // Comma separated
});

export default function CreateRoomPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: '',
            type: '',
            capacity: '',
            location: '',
            facilities: '',
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Parse facilities
            const facilitiesArray = data.facilities
                ? data.facilities.split(',').map(f => f.trim()).filter(f => f)
                : [];

            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    facilities: facilitiesArray,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Room created',
                    description: 'New room has been added successfully',
                });
                router.push('/dashboard/rooms');
                router.refresh();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to create room',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Room creation error:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add New Room</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Register a new room in the system
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Room Details</CardTitle>
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
                                        <FormLabel>Facilities (comma separated)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g. Projector, Whiteboard, Sound System"
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
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Room
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
