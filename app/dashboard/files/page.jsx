import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import File from '@/models/File';
import Event from '@/models/Event';
import Club from '@/models/Club';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Image, File as FileIcon, Download } from 'lucide-react';
import Link from 'next/link';

async function getFiles() {
    await dbConnect();

    const files = await File.find()
        .sort({ uploadedAt: -1 })
        .populate('eventId', 'title type')
        .populate('clubId', 'name')
        .populate('uploadedBy', 'name email')
        .lean();

    return files.map(file => ({
        ...file,
        _id: file._id.toString(),
        eventId: file.eventId ? { ...file.eventId, _id: file.eventId._id.toString() } : null,
        clubId: file.clubId ? { ...file.clubId, _id: file.clubId._id.toString() } : null,
        uploadedBy: file.uploadedBy ? { ...file.uploadedBy, _id: file.uploadedBy._id.toString() } : null,
    }));
}

export default async function FilesPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const files = await getFiles();

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return Image;
        if (fileType.includes('pdf')) return FileText;
        return FileIcon;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">File Repository</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Centralized storage for all documents and files
                    </p>
                </div>
                <Link href="/dashboard/files/upload">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload File
                    </Button>
                </Link>
            </div>

            {/* Files Grid */}
            {files.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileIcon className="h-12 w-12 text-zinc-400 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-4">
                            No files uploaded yet. Upload your first file to get started.
                        </p>
                        <Link href="/dashboard/files/upload">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload File
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {files.map((file) => {
                        const Icon = getFileIcon(file.fileType);
                        return (
                            <Card key={file._id} className="h-full hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                                                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base leading-tight truncate">
                                                    {file.fileName}
                                                </CardTitle>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {formatFileSize(file.fileSize)}
                                                </p>
                                            </div>
                                        </div>
                                        {(session.user.role === 'ADMIN' || session.user.role === 'LX_TEAM') && (
                                            <FileActions fileId={file._id} fileName={file.fileName} />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {file.description && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                            {file.description}
                                        </p>
                                    )}

                                    {/* Tags */}
                                    {file.tags && file.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {file.tags.slice(0, 3).map((tag, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {file.tags.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{file.tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Event/Club */}
                                    {file.eventId && (
                                        <div className="text-sm">
                                            <span className="text-zinc-500">Event: </span>
                                            <Link
                                                href={`/dashboard/events/${file.eventId._id}`}
                                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {file.eventId.title}
                                            </Link>
                                        </div>
                                    )}

                                    {file.clubId && (
                                        <div className="text-sm">
                                            <span className="text-zinc-500">Club: </span>
                                            <span className="font-medium">{file.clubId.name}</span>
                                        </div>
                                    )}

                                    {/* Upload Info */}
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                                        <p>Uploaded by {file.uploadedBy?.name}</p>
                                        <p>{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* Download Button */}
                                    <a
                                        href={file.filePath}
                                        download
                                        className="block"
                                    >
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
