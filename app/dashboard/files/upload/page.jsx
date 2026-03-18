'use client';

import { useState, useEffect } from 'react';
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
    FormDescription,
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
import { Loader2, Upload, File as FileIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const uploadSchema = z.object({
    fileName: z.string().min(2, 'File name must be at least 2 characters'),
    description: z.string().optional(),
    tags: z.string().optional(),
    clubId: z.string().optional(),
    eventId: z.string().optional(),
});

export default function FileUploadPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);

    const form = useForm({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            fileName: '',
            description: '',
            tags: '',
            clubId: '',
            eventId: '',
        },
    });

    useEffect(() => {
        // Fetch clubs and events for selection
        const fetchData = async () => {
            try {
                const [clubsRes, eventsRes] = await Promise.all([
                    fetch('/api/clubs'),
                    fetch('/api/events'),
                ]);
                if (clubsRes.ok) setClubs(await clubsRes.json());
                if (eventsRes.ok) setEvents(await eventsRes.json());
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };
        fetchData();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Auto-fill filename if empty
            if (!form.getValues('fileName')) {
                form.setValue('fileName', selectedFile.name);
            }
        }
    };

    const onSubmit = async (values) => {
        if (!file) {
            toast({ title: 'Please select a file', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', 'repository');

            // 1. Upload using server-side API
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const text = await res.text();
            let uploadData;
            try {
                uploadData = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse response as JSON. Raw text:', text);
                throw new Error('Server returned malformed response. Check console for details.');
            }

            if (!res.ok) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            // 2. Save Record to Database
            const payload = {
                fileName: values.fileName,
                filePath: uploadData.url,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                description: values.description,
                clubId: values.clubId && values.clubId !== 'none' ? values.clubId : null,
                eventId: values.eventId && values.eventId !== 'none' ? values.eventId : null,
                tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
                semester: 'Spring 2026', // Default for now
            };

            const response = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save file record');
            }

            toast({
                title: 'File Uploaded',
                description: 'The file has been saved to the repository',
            });
            router.push('/dashboard/files');
            router.refresh();
        } catch (error) {
            console.error('Upload process error:', error);
            toast({
                title: 'Upload Failed',
                description: error.message || 'An error occurred during upload',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Upload File</h1>
                <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>File Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* File Selector */}
                            <div className="space-y-4">
                                <FormLabel>Select File</FormLabel>
                                {!file ? (
                                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
                                        <input
                                            type="file"
                                            id="file-input"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="file-input" className="cursor-pointer">
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-10 w-10 text-zinc-400 mb-4" />
                                                <p className="text-sm font-medium">Click to choose a file</p>
                                                <p className="text-xs text-zinc-500 mt-1">Maximum size: 50MB</p>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                                                <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setFile(null)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="fileName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Budget Report 2026" {...field} />
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
                                            <Textarea placeholder="What is this file for?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="clubId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Club (Optional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select club" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {clubs.map((club) => (
                                                        <SelectItem key={club._id} value={club._id}>{club.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="eventId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event (Optional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select event" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {events.map((event) => (
                                                        <SelectItem key={event._id} value={event._id}>{event.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. report, budget, 2026 (comma separated)" {...field} />
                                        </FormControl>
                                        <FormDescription>Help others find this file by adding tags.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading || uploading}>
                                {(loading || uploading) ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload to Repository
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
