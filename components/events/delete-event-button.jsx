'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function DeleteEventButton({ eventId, eventTitle }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete event');
            }

            toast.success('Event deleted', {
                description: `"${eventTitle}" has been removed.`,
            });
            router.push('/dashboard/events');
            router.refresh();
        } catch (error) {
            console.error('Delete event error:', error);
            toast.error('Failed to delete event', {
                description: error.message || 'Please try again.',
            });
            setLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
            </Button>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Delete Event?"
                description={`"${eventTitle}" will be permanently deleted along with its approval request. This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
