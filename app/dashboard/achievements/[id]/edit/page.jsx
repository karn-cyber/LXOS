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

const achievementSchema = z.object({
    title: z.string().min(1, 'Achievement title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    points: z.coerce.number().min(0, 'Points must be a positive number'),
    date: z.string().min(1, 'Date is required'),
    recipientType: z.enum(['STUDENT', 'CLUB', 'CLAN']),
    recipientName: z.string().min(1, 'Recipient name is required'),
});

export default function EditAchievementPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [achievement, setAchievement] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(achievementSchema),
        defaultValues: {
            title: '',
            description: '',
            category: '',
            points: 0,
            date: '',
            recipientType: 'STUDENT',
            recipientName: '',
        },
    });

    const fetchAchievement = useCallback(async () => {
        try {
            const response = await fetch(`/api/achievements/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch achievement');
            }
            const data = await response.json();
            setAchievement(data);
            
            // Format date for input
            const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
            
            // Set form values
            form.reset({
                title: data.title,
                description: data.description,
                category: data.category,
                points: data.points,
                date: formattedDate,
                recipientType: data.recipientType,
                recipientName: data.recipientName,
            });
        } catch (error) {
            console.error('Error fetching achievement:', error);
            toast.error('Failed to fetch achievement details');
            router.push('/dashboard/achievements');
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
        const canEdit = hasPermission(userRole, PERMISSIONS.CREATE_ACHIEVEMENT) || 
                       session.user.role === 'ADMIN';
        
        if (!canEdit) {
            toast.error('You do not have permission to edit achievements');
            router.push('/dashboard/achievements');
            return;
        }

        fetchAchievement();
    }, [session, status, router, params.id, fetchAchievement]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/achievements/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update achievement');
            }

            const result = await response.json();
            toast.success(result.message || 'Achievement updated successfully!');
            router.push('/dashboard/achievements');
        } catch (error) {
            console.error('Error updating achievement:', error);
            toast.error(error.message || 'Failed to update achievement');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this achievement? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/achievements/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete achievement');
            }

            const result = await response.json();
            toast.success(result.message || 'Achievement deleted successfully!');
            router.push('/dashboard/achievements');
        } catch (error) {
            console.error('Error deleting achievement:', error);
            toast.error(error.message || 'Failed to delete achievement');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (status === 'loading' || fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading achievement details...</p>
                </div>
            </div>
        );
    }

    if (!achievement) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">Achievement not found</p>
                    <Link href="/dashboard/achievements">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Achievements
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
                    <Link href="/dashboard/achievements">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Achievement</h1>
                        <p className="text-gray-600">Update achievement information and details</p>
                    </div>
                </div>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={deleteLoading}
                    className="ml-4"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLoading ? 'Deleting...' : 'Delete Achievement'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Achievement Information</CardTitle>
                    <CardDescription>
                        Update the achievement details and recognition
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Achievement Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. First Place in Hackathon 2024" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Academic">Academic</SelectItem>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                                    <SelectItem value="Sports">Sports</SelectItem>
                                                    <SelectItem value="Leadership">Leadership</SelectItem>
                                                    <SelectItem value="Community Service">Community Service</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="points"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Points Awarded</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="100" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="recipientType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Recipient Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select recipient type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="STUDENT">Student</SelectItem>
                                                    <SelectItem value="CLUB">Club</SelectItem>
                                                    <SelectItem value="CLAN">Clan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="recipientName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Recipient Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Achievement Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detailed description of the achievement..."
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
                                    {loading ? 'Updating...' : 'Update Achievement'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
