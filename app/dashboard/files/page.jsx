import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import File from '@/models/File';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ImageIcon, File as FileIcon, Download } from 'lucide-react';
import { getDashboardSession } from '@/lib/dashboard-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

async function getFiles() {
    await dbConnect();
    const files = await File.find()
        .sort({ createdAt: -1 })
        .populate('eventId', 'title')
        .populate('clubId', 'name')
        .populate('uploadedBy', 'name')
        .lean();
    return JSON.parse(JSON.stringify(files));
}

function getFileIcon(mime) {
    if (!mime) return FileIcon;
    if (mime.startsWith('image/')) return ImageIcon;
    if (mime.includes('pdf')) return FileText;
    return FileIcon;
}

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilesSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-14 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

const TYPE_COLORS = {
    Bill:     'text-red-600 bg-red-50 dark:bg-red-950/30',
    Report:   'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Poster:   'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Document: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    Other:    'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

async function FilesContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const files = await getFiles();
    const canUpload = hasPermission(session.user.role, PERMISSIONS.UPLOAD_FILE);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Repository</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {files.length} file{files.length !== 1 ? 's' : ''} · bills, reports, posters
                    </p>
                </div>
                {canUpload && (
                    <Link href="/dashboard/files/upload">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            Upload
                        </Button>
                    </Link>
                )}
            </div>

            {files.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No files uploaded yet.
                    {canUpload && (
                        <Link href="/dashboard/files/upload" className="block mt-2 text-primary text-xs hover:underline">
                            Upload the first file →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                    {files.map(file => {
                        const Icon = getFileIcon(file.mimeType);
                        const typeStyle = TYPE_COLORS[file.type] || TYPE_COLORS.Other;
                        return (
                            <div key={file._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                        {file.originalName || file.filename}
                                    </p>
                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                        {file.uploadedBy?.name || '—'}
                                        {file.eventId && ` · ${file.eventId.title}`}
                                        {file.clubId && ` · ${file.clubId.name}`}
                                        {file.size && ` · ${formatSize(file.size)}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeStyle}`}>
                                        {file.type || 'Other'}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                        {new Date(file.createdAt || file.uploadedAt).toLocaleDateString()}
                                    </span>
                                    {file.path && (
                                        <a href={file.path} download>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400 hover:text-primary">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function FilesPage() {
    return (
        <Suspense fallback={<FilesSkeleton />}>
            <FilesContent />
        </Suspense>
    );
}
