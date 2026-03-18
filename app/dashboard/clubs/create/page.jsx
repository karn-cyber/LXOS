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
import { Loader2 } from 'lucide-react';

const clubSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    budgetAllocated: z.coerce.number().min(0, 'Budget must be positive'),
});

export default function CreateClubPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(clubSchema),
        defaultValues: {
            name: '',
            description: '',
            category: '',
            budgetAllocated: 0,
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch('/api/clubs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast({
                    title: 'Club created',
                    description: 'New club has been added successfully',
                });
                router.push('/dashboard/clubs');
                router.refresh();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to create club',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Club creation error:', error);
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
                <h1 className="text-3xl font-bold tracking-tight">Add New Club</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Register a new student club
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Club Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Club Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Coding Club" {...field} />
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
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                                    <SelectItem value="Sports">Sports</SelectItem>
                                                    <SelectItem value="Literary">Literary</SelectItem>
                                                    <SelectItem value="Social">Social</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                            </div>

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
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Club
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
