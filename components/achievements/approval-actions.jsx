'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AchievementApprovalActions({ achievementId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action) => {
        if (!achievementId) return;

        let rejectionReason = '';
        if (action === 'reject') {
            rejectionReason = window.prompt('Rejection reason (optional):') || '';
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/achievements/${achievementId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, rejectionReason }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to process approval');
            }

            toast.success(action === 'approve' ? 'Update approved' : 'Update rejected');
            router.refresh();
        } catch (error) {
            toast.error(error.message || 'Failed to process approval');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                size="sm"
                onClick={() => handleAction('approve')}
                disabled={loading}
            >
                Approve
            </Button>
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleAction('reject')}
                disabled={loading}
            >
                Reject
            </Button>
        </div>
    );
}
