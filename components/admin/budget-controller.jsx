'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function BudgetController({ entityId, entityType, currentBudget, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(currentBudget);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const endpoint = entityType === 'CLUB' ? `/api/clubs/${entityId}` : `/api/clans/${entityId}`;

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ budgetAllocated: Number(amount) }),
            });

            if (!res.ok) throw new Error('Failed to update budget');

            toast({
                title: 'Budget Updated',
                description: `New budget set to ₹${Number(amount).toLocaleString()}`,
            });

            setOpen(false);
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update budget. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <Pencil className="h-4 w-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Budget Allocation</DialogTitle>
                    <DialogDescription>
                        Set the total allocated budget for this {entityType.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="budget" className="text-right">
                            Amount (₹)
                        </Label>
                        <Input
                            id="budget"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? 'Updating...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
