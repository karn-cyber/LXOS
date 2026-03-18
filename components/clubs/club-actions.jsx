'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function ClubActions({ clubId, clubName }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async (e) => {
        e.preventDefault(); // Prevent navigation to detail page
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${clubName}"? This action cannot be undone.`)) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/clubs/${clubId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: 'Club deleted',
                    description: 'The club has been removed successfully',
                });
                router.refresh();
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to delete club',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Delete error:', error);
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
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
