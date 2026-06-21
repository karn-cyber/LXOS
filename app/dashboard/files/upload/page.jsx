'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, ImageIcon, Receipt, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['Food', 'Travel', 'Materials', 'Equipment', 'Printing', 'Accommodation', 'Other'];

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubmitReimbursementPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [category, setCategory] = useState('Other');
    const [bills, setBills] = useState([]); // { file, preview, uploading, url, error }
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // What the claim is for (used to group claims in the reimbursement table).
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [purpose, setPurpose] = useState('');

    // Bank details for the payout.
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetch('/api/events')
            .then(r => r.ok ? r.json() : [])
            .then(data => setEvents(Array.isArray(data) ? data : []))
            .catch(() => setEvents([]));
    }, []);

    const handleFilesSelected = (e) => {
        const selected = Array.from(e.target.files || []);
        const newBills = selected.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            uploading: false,
            url: null,
            error: null,
        }));
        setBills(prev => [...prev, ...newBills]);
        e.target.value = '';
    };

    const removeBill = (index) => {
        setBills(prev => {
            const next = [...prev];
            if (next[index].preview) URL.revokeObjectURL(next[index].preview);
            next.splice(index, 1);
            return next;
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files);
        const newBills = dropped.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            uploading: false,
            url: null,
            error: null,
        }));
        setBills(prev => [...prev, ...newBills]);
    };

    const uploadBill = async (billEntry) => {
        const formData = new FormData();
        formData.append('file', billEntry.file);
        formData.append('path', 'reimbursements');
        let res;
        try {
            res = await fetch('/api/upload', { method: 'POST', body: formData });
        } catch (networkErr) {
            throw new Error('Network error — check that the dev server is running and Supabase env vars are set.');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Upload failed (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!data.url) throw new Error('Server did not return a file URL');
        return data.url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) return setError('Please enter a title.');
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setError('Please enter a valid amount.');
        if (!expenseDate) return setError('Please select the expense date.');
        if (bills.length === 0) return setError('Please attach at least one bill image.');
        if (!accountHolderName.trim()) return setError('Please enter the account holder name.');
        if (!accountNumber.trim()) return setError('Please enter the account number.');
        if (!ifsc.trim()) return setError('Please enter the IFSC code.');

        setSubmitting(true);

        try {
            // Upload all bills in parallel, tracking progress per file
            const uploadedBills = [];
            setBills(prev => prev.map(b => ({ ...b, uploading: true })));

            const results = await Promise.allSettled(
                bills.map(b => uploadBill(b))
            );

            const failedIndexes = [];
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    uploadedBills.push({
                        originalName: bills[i].file.name,
                        path: result.value,
                        mimeType: bills[i].file.type,
                        size: bills[i].file.size,
                    });
                } else {
                    failedIndexes.push(i);
                }
            });

            setBills(prev => prev.map((b, i) => ({
                ...b,
                uploading: false,
                url: results[i].status === 'fulfilled' ? results[i].value : null,
                error: results[i].status === 'rejected' ? results[i].reason?.message : null,
            })));

            if (failedIndexes.length > 0) {
                setError(`${failedIndexes.length} file(s) failed to upload. Please remove them and try again.`);
                setSubmitting(false);
                return;
            }

            // Submit reimbursement
            const res = await fetch('/api/reimbursements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    amount: Number(amount),
                    expenseDate,
                    category,
                    bills: uploadedBills,
                    eventId: eventId || null,
                    purpose: purpose.trim(),
                    bankDetails: {
                        accountHolderName: accountHolderName.trim(),
                        accountNumber: accountNumber.trim(),
                        ifsc: ifsc.trim().toUpperCase(),
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit');
            }

            router.push('/dashboard/files');
            router.refresh();
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/files">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Submit Reimbursement</h1>
                    <p className="text-sm text-zinc-400 mt-0.5">Attach your bills and claim the amount spent</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bill upload zone */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Bill Images <span className="text-red-400">*</span>
                    </Label>
                    <div
                        className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleFilesSelected}
                        />
                        <Upload className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Drop files here or click to select
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">JPG, PNG, PDF · Multiple files at once · Max 10 MB each</p>
                    </div>

                    {/* Preview grid */}
                    {bills.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {bills.map((bill, i) => (
                                <div
                                    key={i}
                                    className={`relative border rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${
                                        bill.error ? 'border-red-200 dark:border-red-900' : 'border-zinc-100 dark:border-zinc-800'
                                    }`}
                                >
                                    {bill.preview ? (
                                        <img
                                            src={bill.preview}
                                            alt={bill.file.name}
                                            className="w-full h-32 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-32 flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-zinc-300" />
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-[10px] text-zinc-500 truncate">{bill.file.name}</p>
                                        <p className="text-[10px] text-zinc-400">{formatSize(bill.file.size)}</p>
                                        {bill.uploading && (
                                            <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                                                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Uploading…
                                            </p>
                                        )}
                                        {bill.url && (
                                            <p className="text-[10px] text-green-600 mt-0.5">✓ Uploaded</p>
                                        )}
                                        {bill.error && (
                                            <p className="text-[10px] text-red-500 mt-0.5">{bill.error}</p>
                                        )}
                                    </div>
                                    {!submitting && (
                                        <button
                                            type="button"
                                            onClick={() => removeBill(i)}
                                            className="absolute top-1.5 right-1.5 h-5 w-5 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form fields */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            What was this expense for? <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g. Dinner for club meeting, Printed banners for event"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="rounded-lg border-zinc-200 dark:border-zinc-700"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Amount (₹) <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₹</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="pl-7 rounded-lg border-zinc-200 dark:border-zinc-700"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="expenseDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Date of Expense <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="expenseDate"
                                type="date"
                                max={today}
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                                className="rounded-lg border-zinc-200 dark:border-zinc-700"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Category
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                        category === cat
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="eventId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Related Event
                            </Label>
                            <select
                                id="eventId"
                                value={eventId}
                                onChange={e => setEventId(e.target.value)}
                                disabled={events.length === 0}
                                className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm disabled:opacity-60"
                            >
                                <option value="">— Not for a specific event —</option>
                                {events.map(ev => (
                                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                                ))}
                            </select>
                            {events.length === 0 && (
                                <p className="text-[11px] text-zinc-400">
                                    No events created yet — use Purpose / Activity instead.
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="purpose" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Or Purpose / Activity
                            </Label>
                            <Input
                                id="purpose"
                                placeholder="e.g. Spring Fest, Clan Sports Day"
                                value={purpose}
                                onChange={e => setPurpose(e.target.value)}
                                className="rounded-lg border-zinc-200 dark:border-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Additional Details
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Any context that will help the reviewer — number of people, reason, etc."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="rounded-lg border-zinc-200 dark:border-zinc-700 resize-none h-24"
                        />
                    </div>
                </div>

                {/* Bank details for payout */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 space-y-5">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Bank Account for Payout</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Where the reimbursement will be transferred once processed.</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="accountHolderName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Account Holder Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="accountHolderName"
                            placeholder="As printed on the bank account"
                            value={accountHolderName}
                            onChange={e => setAccountHolderName(e.target.value)}
                            className="rounded-lg border-zinc-200 dark:border-zinc-700"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="accountNumber" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Account Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="accountNumber"
                                inputMode="numeric"
                                placeholder="000000000000"
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                                className="rounded-lg border-zinc-200 dark:border-zinc-700"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ifsc" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                IFSC Code <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="ifsc"
                                placeholder="e.g. HDFC0001234"
                                value={ifsc}
                                onChange={e => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                maxLength={11}
                                className="rounded-lg border-zinc-200 dark:border-zinc-700 uppercase"
                                required
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                <div className="flex gap-3">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-xl h-11 font-medium"
                    >
                        {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</>
                        ) : (
                            <><Receipt className="h-4 w-4 mr-2" /> Submit for Reimbursement</>
                        )}
                    </Button>
                    <Link href="/dashboard/files">
                        <Button type="button" variant="outline" className="rounded-xl h-11 px-5">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
