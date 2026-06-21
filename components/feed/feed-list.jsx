'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Users, Flag, X, Maximize2, Calendar } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

const CATEGORY_COLORS = {
    Academic:  'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Sports:    'text-green-600 bg-green-50 dark:bg-green-950/30',
    Cultural:  'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Technical: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
    Social:    'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    Other:     'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

function formatDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FeedList({ updates }) {
    const [openPost, setOpenPost] = useState(null);

    return (
        <>
            <div className="max-w-3xl space-y-4">
                {updates.map((update) => {
                    const catStyle = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.Other;
                    const cover = update.images?.[0];
                    return (
                        <div
                            key={update._id}
                            onClick={() => setOpenPost(update)}
                            className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
                        >
                            {cover && (
                                <div className="relative w-full h-52 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                    {/* Blurred fill so portrait images don't leave empty bars */}
                                    <img
                                        src={cover}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
                                    />
                                    <img
                                        src={cover}
                                        alt={update.title}
                                        className="relative w-full h-full object-contain"
                                    />
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white text-[10px] font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 className="h-3 w-3" />
                                        Open
                                    </div>
                                    {update.images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-[10px] font-medium px-2 py-1">
                                            +{update.images.length - 1} more
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>
                                        {update.category}
                                    </span>
                                    {update.clubId && (
                                        <Link
                                            href={`/dashboard/clubs/${update.clubId._id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="text-[10px] font-medium text-zinc-500 hover:text-primary flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {update.clubId.name}
                                            </span>
                                        </Link>
                                    )}
                                    {update.clanId && (
                                        <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                                            <Flag className="h-3 w-3" />
                                            {update.clanId.name}
                                        </span>
                                    )}
                                    {update.points > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                            {update.points} pts
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{update.title}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                                    {update.description}
                                </p>

                                <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-400">
                                    {update.achievedDate && <span>{formatDate(update.achievedDate)}</span>}
                                    {update.createdBy && (
                                        <>
                                            <span>·</span>
                                            <span>{update.createdBy.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <PostDialog post={openPost} onClose={() => setOpenPost(null)} />
        </>
    );
}

function PostDialog({ post, onClose }) {
    if (!post) return null;
    const catStyle = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other;
    const images = post.images || [];

    return (
        <Dialog open={!!post} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0"
            >
                <DialogTitle className="sr-only">{post.title}</DialogTitle>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                {images.length > 0 && (
                    <div className="bg-zinc-950 flex flex-col items-center">
                        {images.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt={`${post.title} ${i + 1}`}
                                className="w-full max-h-[70vh] object-contain"
                            />
                        ))}
                    </div>
                )}

                <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>
                            {post.category}
                        </span>
                        {post.clubId && (
                            <Link
                                href={`/dashboard/clubs/${post.clubId._id}`}
                                className="text-[10px] font-medium text-zinc-500 hover:text-primary flex items-center gap-1"
                            >
                                <Users className="h-3 w-3" />
                                {post.clubId.name}
                            </Link>
                        )}
                        {post.clanId && (
                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                                <Flag className="h-3 w-3" />
                                {post.clanId.name}
                            </span>
                        )}
                        {post.points > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                {post.points} pts
                            </span>
                        )}
                    </div>

                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{post.title}</h2>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                        {post.achievedDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.achievedDate)}
                            </span>
                        )}
                        {post.createdBy && (
                            <>
                                <span>·</span>
                                <span>{post.createdBy.name}</span>
                            </>
                        )}
                    </div>

                    {post.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-4 leading-relaxed whitespace-pre-wrap">
                            {post.description}
                        </p>
                    )}

                    {post.participants?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                            {post.participants.map((p, i) => (
                                <span key={i} className="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                                    {p}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
