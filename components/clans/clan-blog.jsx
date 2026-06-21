'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Calendar, Loader2, Image as ImageIcon, Send, X } from 'lucide-react';

export default function ClanBlog({ clan, canEdit }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchPosts = useCallback(async () => {
        try {
            const res = await fetch(`/api/achievements?clanId=${clan._id}`);
            const data = res.ok ? await res.json() : [];
            setPosts(Array.isArray(data) ? data : []);
        } catch {
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [clan._id]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setImageUrl(data.url);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (title.trim().length < 5) return setError('Title must be at least 5 characters.');
        if (description.trim().length < 20) return setError('Description must be at least 20 characters.');

        setSubmitting(true);
        try {
            const res = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    clanId: clan._id,
                    category: 'Other',
                    kind: 'UPDATE',
                    date: new Date().toISOString(),
                    images: imageUrl ? [imageUrl] : [],
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to post');
            }
            setTitle(''); setDescription(''); setImageUrl(null); setShowForm(false);
            setLoading(true);
            fetchPosts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" /> {clan.name} Blog & Updates
                </h2>
                {canEdit && (
                    <Button size="sm" onClick={() => setShowForm(v => !v)}>
                        <Plus className="h-4 w-4 mr-1.5" /> {showForm ? 'Close' : 'New Post'}
                    </Button>
                )}
            </div>

            {canEdit && showForm && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Post an update</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <Input placeholder="Title (e.g. We won the championship!)" value={title} onChange={e => setTitle(e.target.value)} />
                            <Textarea placeholder="Share what's happening with your clan…" className="min-h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} />
                            {imageUrl && (
                                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                                    <button type="button" onClick={() => setImageUrl(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex items-center justify-between">
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
                                    <span className="inline-flex items-center text-sm text-zinc-500 hover:text-primary">
                                        {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-1.5" />}
                                        Add image
                                    </span>
                                </label>
                                <Button type="submit" disabled={submitting || uploading}>
                                    {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                                    Post
                                </Button>
                            </div>
                            <p className="text-[11px] text-zinc-400">Posts are sent for admin approval before appearing in the public feed.</p>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12 text-sm text-zinc-400 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading posts…
                </div>
            ) : posts.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <FileText className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm">No posts yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <Card key={post._id} className="overflow-hidden">
                            {post.images?.[0] && (
                                <div className="w-full max-h-72 bg-zinc-950 flex justify-center">
                                    <img src={post.images[0]} alt={post.title} className="max-h-72 object-contain" />
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-base">{post.title}</CardTitle>
                                    {post.status && post.status !== 'APPROVED' && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600">{post.status.toLowerCase()}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-zinc-400">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(post.achievedDate || post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {post.createdBy?.name && <span>· {post.createdBy.name}</span>}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{post.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
