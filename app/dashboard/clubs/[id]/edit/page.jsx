'use client';

import { useState, useEffect } from 'react';
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

const clubSchema = z.object({
    name: z.string().min(1, 'Club name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    budgetAllocated: z.coerce.number().min(0, 'Budget must be a positive number'),
    category: z.string().min(1, 'Category is required'),
});

export default function EditClubPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [club, setClub] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(clubSchema),
        defaultValues: {
            name: '',
            description: '',
            budgetAllocated: 0,
            category: '',
        },
    });

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
            return;
        }

        const userRole = session?.user?.role;
        const canEdit = hasPermission(userRole, PERMISSIONS.EDIT_CLUB) || 
                       hasPermission(userRole, PERMISSIONS.VIEW_ALL_CLUBS);
        
        if (!canEdit) {
            toast.error('You do not have permission to edit clubs');
            router.push('/dashboard/clubs');
            return;
        }

        fetchClub();
    }, [session, status]);

    const fetchClub = async () => {
        try {
            const response = await fetch(`/api/clubs/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch club');
            }
            const data = await response.json();
            setClub(data);
            
            // Set form values
            form.reset({
                name: data.name,
                description: data.description,
                budgetAllocated: data.budgetAllocated,
                category: data.category,
            });
        } catch (error) {
            console.error('Error fetching club:', error);
            toast.error('Failed to fetch club details');
            router.push('/dashboard/clubs');
        } finally {
            setFetchLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/clubs/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update club');
            }

            const result = await response.json();
            toast.success(result.message || 'Club updated successfully!');
            router.push(`/dashboard/clubs/${params.id}`);
        } catch (error) {
            console.error('Error updating club:', error);
            toast.error(error.message || 'Failed to update club');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/clubs/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete club');
            }

            const result = await response.json();
            toast.success(result.message || 'Club deleted successfully!');
            router.push('/dashboard/clubs');
        } catch (error) {
            console.error('Error deleting club:', error);
            toast.error(error.message || 'Failed to delete club');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (status === 'loading' || fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading club details...</p>
                </div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">Club not found</p>
                    <Link href="/dashboard/clubs">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Clubs
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
                    <Link href={`/dashboard/clubs/${params.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Club</h1>
                        <p className="text-gray-600">Update club information and settings</p>
                    </div>
                </div>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={deleteLoading}
                    className="ml-4"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLoading ? 'Deleting...' : 'Delete Club'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Club Information</CardTitle>
                    <CardDescription>
                        Update the club details and budget allocation
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
                                            <FormLabel>Club Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Tech Club" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Technical" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="budgetAllocated"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Allocated Budget (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50000" {...field} />
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
                                                placeholder="Brief description of the club..."
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
                                    {loading ? 'Updating...' : 'Update Club'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
