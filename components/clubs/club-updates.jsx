'use client';

import { useState } from 'react';
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
import { Loader2, Image as ImageIcon, Send, Trophy, Calendar } from 'lucide-react';
import Image from 'next/image';

const updateSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
});

export default function ClubUpdates({ clubId, updates, canPost }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    const form = useForm({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            title: '',
            description: '',
        },
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', `club-updates/${clubId}`);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse response as JSON. Raw text:', text);
                throw new Error('Server returned malformed response. Check console for details.');
            }

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setImageUrl(data.url);
            toast({ title: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload failed',
                description: error.message || 'Error uploading image',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                clubId,
                date: new Date().toISOString(),
                category: 'Other', // General update
                images: imageUrl ? [imageUrl] : [],
            };

            const response = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: 'Update submitted',
                    description: 'Your update is pending admin approval before it appears to others.',
                });
                form.reset();
                setImageUrl(null);
                // Simple refresh for now - ideally we'd optimistic update or revalidate
                window.location.reload();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to post update',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to post update', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Create Post Section */}
            {canPost && (
                <Card>
                    <CardHeader>
                        <CardTitle>Post an Update</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Update Title (e.g., We won the Hackathon!)" {...field} />
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
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Share what's happening..."
                                                    className="resize-none min-h-25"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {imageUrl && (
                                    <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden">
                                        <Image
                                            src={imageUrl}
                                            alt="Upload preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                            onClick={() => setImageUrl(null)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center">
                                        <input
                                            type="file"
                                            id="image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                        <label htmlFor="image-upload">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                                asChild
                                                disabled={uploading}
                                            >
                                                <span>
                                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                                                    Add Image
                                                </span>
                                            </Button>
                                        </label>
                                    </div>

                                    <Button type="submit" disabled={loading || uploading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        Post Update
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}

            {/* Updates Feed */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Latest Updates</h2>

                {updates.length === 0 ? (
                    <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
                            <Trophy className="h-10 w-10 mb-3 opacity-50" />
                            <p>No updates posted yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    updates.map((update) => (
                        <Card key={update._id} className="overflow-hidden">
                            {update.images && update.images.length > 0 && (
                                <div className="relative w-full h-64 bg-zinc-100 dark:bg-zinc-900">
                                    <Image
                                        src={update.images[0]}
                                        alt={update.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{update.title}</CardTitle>
                                        <div className="flex items-center text-sm text-zinc-500 mt-2">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(update.achievedDate).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    {update.pointsAwarded > 0 && (
                                        <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                                            <Trophy className="h-3 w-3 mr-1" />
                                            {update.pointsAwarded} pts
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                                    {update.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
