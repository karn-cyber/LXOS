'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ReimbursementReview({ id }) {
    const router = useRouter();
    const [action, setAction] = useState(null); // 'approve' | 'reject'
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        setError('');
        if (action === 'reject' && !rejectionReason.trim()) {
            setError('Please provide a reason for rejection.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/reimbursements/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                    notes: notes.trim() || null,
                    rejectionReason: action === 'reject' ? rejectionReason.trim() : null,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update');
            }

            router.push('/dashboard/files');
            router.refresh();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Review this request</h2>

            {!action ? (
                <div className="flex gap-3">
                    <Button
                        onClick={() => setAction('approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 text-sm font-medium"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        onClick={() => setAction('reject')}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10 text-sm font-medium"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
                        action === 'approve'
                            ? 'text-green-700 bg-green-50 dark:bg-green-950/30'
                            : 'text-red-600 bg-red-50 dark:bg-red-950/30'
                    }`}>
                        {action === 'approve' ? 'Approving this request' : 'Rejecting this request'}
                    </div>

                    {action === 'reject' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Reason for rejection <span className="text-red-400">*</span>
                            </label>
                            <Textarea
                                placeholder="Why is this being rejected?"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                className="rounded-lg border-zinc-200 dark:border-zinc-700 resize-none h-20 text-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Notes (optional)
                        </label>
                        <Textarea
                            placeholder="Any additional notes for the submitter…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="rounded-lg border-zinc-200 dark:border-zinc-700 resize-none h-16 text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={submit}
                            disabled={loading}
                            className={`flex-1 rounded-xl h-9 text-sm font-medium ${
                                action === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setAction(null); setError(''); }}
                            disabled={loading}
                            className="rounded-xl h-9 text-sm"
                        >
                            Back
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
