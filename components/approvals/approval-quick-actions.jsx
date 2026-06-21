'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

/**
 * Inline Approve / Reject for event, room-booking and achievement approvals, so
 * reviewers can act directly from the list (or detail page) without extra steps.
 * `kind` selects the endpoint: 'achievement' -> /api/achievements/[id]/approve,
 * anything else -> /api/events/[id]/approve. Both share the {action} contract.
 */
export default function ApprovalQuickActions({ entityId, kind = 'event', onDone }) {
    const router = useRouter();
    const [loading, setLoading] = useState(null); // 'approve' | 'reject'
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');

    const base = kind === 'achievement' ? 'achievements' : 'events';

    const act = async (action, rejectionReason) => {
        setLoading(action);
        try {
            const res = await fetch(`/api/${base}/${entityId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, rejectionReason }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed');
            }
            if (onDone) onDone();
            router.refresh();
        } catch (e) {
            alert(e.message || 'Action failed');
            setLoading(null);
        }
    };

    if (rejecting) {
        return (
            <div className="flex items-center gap-2 shrink-0">
                <input
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason…"
                    className="h-8 w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-xs"
                />
                <Button
                    size="sm"
                    onClick={() => reason.trim() && act('reject', reason.trim())}
                    disabled={!reason.trim() || loading}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8 text-xs"
                >
                    {loading === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setRejecting(false); setReason(''); }} className="rounded-lg h-8 text-xs">
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <Button
                size="sm"
                onClick={() => act('approve')}
                disabled={!!loading}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 text-xs font-medium"
            >
                {loading === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (<><Check className="h-3.5 w-3.5 mr-1" /> Approve</>)}
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={() => setRejecting(true)}
                disabled={!!loading}
                className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 text-xs font-medium"
            >
                <X className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
        </div>
    );
}
