import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EmptyState({
    icon: Icon = FileText,
    title = 'No items found',
    description = 'Get started by creating your first item.',
    actionLabel,
    actionHref,
    showAction = true
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-sm mb-6">
                {description}
            </p>
            {showAction && actionHref && actionLabel && (
                <Link href={actionHref}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                </Link>
            )}
        </div>
    );
}
