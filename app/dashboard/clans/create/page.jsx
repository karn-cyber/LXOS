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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const clanSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(5, 'Description is required'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color code (e.g. #FF0000)'),
    budgetAllocated: z.coerce.number().min(0, 'Budget must be positive'),
});

export default function CreateClanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(clanSchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#000000',
            budgetAllocated: 0,
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch('/api/clans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast({
                    title: 'Clan created',
                    description: 'New clan has been added successfully',
                });
                router.push('/dashboard/clans');
                router.refresh();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to create clan',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Clan creation error:', error);
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
                <h1 className="text-3xl font-bold tracking-tight">Add New Clan</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Create a new clan participating in LX
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clan Details</CardTitle>
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
                                            <FormLabel>Clan Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Titans" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Theme Color (Hex)</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="#FF0000" {...field} />
                                                </FormControl>
                                                <div
                                                    className="w-10 h-10 rounded border border-zinc-200"
                                                    style={{ backgroundColor: field.value }}
                                                />
                                            </div>
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
                                                placeholder="Brief description of the clan..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
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

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="outline" onClick={() => router.back()} className="mr-4">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Clan
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
