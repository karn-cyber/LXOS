'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Trophy, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function PointsManager({ clan, isAdmin }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [points, setPoints] = useState(clan.points);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState(0);
    const [mode, setMode] = useState('set'); // 'set', 'add', 'subtract'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalPoints;
            switch (mode) {
                case 'add':
                    finalPoints = clan.points + Math.abs(pointsToAdd);
                    break;
                case 'subtract':
                    finalPoints = Math.max(0, clan.points - Math.abs(pointsToAdd));
                    break;
                default:
                    finalPoints = points;
            }

            const response = await fetch(`/api/clans/${clan._id}/points`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    points: finalPoints,
                    reason: reason || `Points ${mode === 'add' ? 'added' : mode === 'subtract' ? 'subtracted' : 'updated'} by admin`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update points');
            }

            const result = await response.json();
            
            toast.success(result.message || 'Points updated successfully!');
            setIsOpen(false);
            setReason('');
            setPointsToAdd(0);
            
            // Refresh the page to show updated data
            router.refresh();
        } catch (error) {
            console.error('Error updating points:', error);
            toast.error('Failed to update points. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Manage Points
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Manage {clan.name} Points
                    </DialogTitle>
                    <DialogDescription>
                        Update clan points. Current points: <strong>{clan.points}</strong>
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Mode Selection */}
                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant={mode === 'set' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('set')}
                        >
                            Set Points
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'add' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('add')}
                            className="gap-1"
                        >
                            <Plus className="h-3 w-3" />
                            Add
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'subtract' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('subtract')}
                            className="gap-1"
                        >
                            <Minus className="h-3 w-3" />
                            Subtract
                        </Button>
                    </div>

                    {/* Points Input */}
                    <div className="space-y-2">
                        <Label htmlFor="points">
                            {mode === 'set' ? 'New Points Total' : 
                             mode === 'add' ? 'Points to Add' : 'Points to Subtract'}
                        </Label>
                        {mode === 'set' ? (
                            <Input
                                id="points"
                                type="number"
                                min="0"
                                value={points}
                                onChange={(e) => setPoints(Number(e.target.value))}
                                required
                            />
                        ) : (
                            <Input
                                id="pointsToAdd"
                                type="number"
                                min="1"
                                value={pointsToAdd}
                                onChange={(e) => setPointsToAdd(Number(e.target.value))}
                                required
                            />
                        )}
                    </div>

                    {/* Preview */}
                    {mode !== 'set' && pointsToAdd > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-sm">
                                <strong>Preview:</strong> {clan.points} {mode === 'add' ? '+' : '-'} {pointsToAdd} = {' '}
                                <span className="font-semibold">
                                    {mode === 'add' 
                                        ? clan.points + pointsToAdd 
                                        : Math.max(0, clan.points - pointsToAdd)
                                    }
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason for points adjustment..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Points'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
