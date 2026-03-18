'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    FileText,
    Plus,
    Edit,
    Trash2,
    Calendar,
    User,
    Eye,
    MessageSquare
} from 'lucide-react';

export default function ClanBlog({ clan, canEdit, isAdmin, isClanLeader, userId }) {
    const [blogPosts] = useState([
        // Mock data - replace with actual API call
        {
            _id: '1',
            title: 'Clan Championship Victory!',
            excerpt: 'Our amazing performance in the inter-clan sports competition brought us closer to the top of the leaderboard...',
            content: 'Full content here...',
            author: {
                _id: 'user1',
                name: 'John Doe',
                role: 'CLAN_HEAD'
            },
            tags: ['sports', 'victory', 'teamwork'],
            publishedAt: '2024-01-20',
            updatedAt: '2024-01-20',
            views: 245,
            comments: 12,
            published: true
        },
        {
            _id: '2',
            title: 'Upcoming Cultural Festival Planning',
            excerpt: 'Planning is underway for our clan\'s contribution to the upcoming cultural festival. Here\'s what we have in store...',
            content: 'Full content here...',
            author: {
                _id: 'user2',
                name: 'Jane Smith',
                role: 'CLAN_HEAD'
            },
            tags: ['culture', 'festival', 'planning'],
            publishedAt: '2024-01-15',
            updatedAt: '2024-01-16',
            views: 156,
            comments: 8,
            published: true
        },
        {
            _id: '3',
            title: 'Community Service Initiative Results',
            excerpt: 'Our recent community service project exceeded all expectations. Here are the amazing results and impact we created...',
            content: 'Full content here...',
            author: {
                _id: 'user3',
                name: 'Mike Johnson',
                role: 'ADMIN'
            },
            tags: ['community', 'service', 'impact'],
            publishedAt: '2024-01-10',
            updatedAt: '2024-01-10',
            views: 189,
            comments: 15,
            published: true
        }
    ]);

    const [filter, setFilter] = useState('all');

    const filteredPosts = blogPosts.filter(post => {
        if (filter === 'my-posts' && isClanLeader) {
            return post.author._id === userId;
        }
        return true;
    });

    const canEditPost = (post) => {
        return isAdmin || (isClanLeader && post.author._id === userId);
    };

    const canDeletePost = (post) => {
        return isAdmin || (isClanLeader && post.author._id === userId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Clan Blog</h2>
                    <p className="text-zinc-500">Share updates, achievements, and stories from {clan.name}</p>
                </div>
                {canEdit && (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                    </Button>
                )}
            </div>

            {/* Filter Options */}
            <div className="flex space-x-2">
                <Button 
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All Posts ({blogPosts.length})
                </Button>
                {isClanLeader && (
                    <Button 
                        variant={filter === 'my-posts' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('my-posts')}
                    >
                        My Posts ({blogPosts.filter(p => p.author._id === userId).length})
                    </Button>
                )}
            </div>

            {/* Blog Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{blogPosts.length}</p>
                            <p className="text-sm text-zinc-500">Total Posts</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {blogPosts.reduce((acc, post) => acc + post.views, 0)}
                            </p>
                            <p className="text-sm text-zinc-500">Total Views</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {blogPosts.reduce((acc, post) => acc + post.comments, 0)}
                            </p>
                            <p className="text-sm text-zinc-500">Total Comments</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Blog Posts */}
            {filteredPosts.length > 0 ? (
                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <Card key={post._id} className="transition-shadow hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                                            <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {post.published && (
                                                <Badge variant="success">Published</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {post.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Meta Information */}
                                    <div className="flex items-center justify-between text-sm text-zinc-500">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                <span>{post.author.name}</span>
                                                <Badge variant="outline" className="text-xs ml-1">
                                                    {post.author.role.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                <span>{post.views}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{post.comments}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Read More
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            {canEditPost(post) && (
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                            )}
                                            {canDeletePost(post) && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {filter === 'my-posts' ? 'No posts by you yet' : 'No blog posts yet'}
                        </h3>
                        <p className="text-zinc-500 mb-4">
                            {filter === 'my-posts' 
                                ? 'Start sharing your thoughts and experiences with the clan.' 
                                : `${clan.name} hasn&apos;t published any blog posts yet.`
                            }
                        </p>
                        {canEdit && (
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Write First Post
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
