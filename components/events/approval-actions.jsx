'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ApprovalActions({ eventId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${eventId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve event');
            }

            toast.success('Event approved successfully!', {
                description: 'The event is now live and visible on the calendar.',
            });
            router.refresh();
        } catch (error) {
            console.error('Approval error:', error);
            toast.error('Failed to approve event', {
                description: 'Please try again or contact support if the issue persists.',
            });
        } finally {
            setLoading(false);
            setShowApproveConfirm(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Rejection reason required', {
                description: 'Please provide a reason for rejecting this event.',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/events/${eventId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectionReason }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject event');
            }

            toast.success('Event rejected', {
                description: 'The requestor has been notified of your decision.',
            });
            router.refresh();
        } catch (error) {
            console.error('Rejection error:', error);
            toast.error('Failed to reject event', {
                description: 'Please try again or contact support if the issue persists.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Pending Approval</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                This event is waiting for your approval
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowApproveConfirm(true)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                onClick={() => setShowRejectForm(!showRejectForm)}
                                disabled={loading}
                                variant="destructive"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>

                    {showRejectForm && (
                        <div className="space-y-3 pt-4 border-t border-yellow-200 dark:border-yellow-900">
                            <Textarea
                                placeholder="Provide a reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleReject}
                                    disabled={loading || !rejectionReason.trim()}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Confirm Rejection
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowRejectForm(false);
                                        setRejectionReason('');
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={showApproveConfirm}
                onOpenChange={setShowApproveConfirm}
                title="Approve Event?"
                description="This event will be approved and made visible on the calendar. This action cannot be undone."
                confirmText="Approve"
                onConfirm={handleApprove}
                onCancel={() => setShowApproveConfirm(false)}
            />
        </>
    );
}
