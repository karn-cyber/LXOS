import mongoose from 'mongoose';

const ReimbursementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this reimbursement'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide the amount to be reimbursed'],
        min: [1, 'Amount must be at least ₹1'],
    },
    expenseDate: {
        type: Date,
        required: [true, 'Please provide the date the expense was incurred'],
    },
    category: {
        type: String,
        enum: ['Food', 'Travel', 'Materials', 'Equipment', 'Printing', 'Accommodation', 'Other'],
        default: 'Other',
    },
    // What this reimbursement is for — used to group claims in the CRM table.
    // eventId links a formal event; purpose is free text for fests / clan
    // activities / anything that isn't a formal Event.
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null,
    },
    purpose: {
        type: String,
        default: '',
        trim: true,
    },
    // Where the money should be sent. Collected at submission time.
    bankDetails: {
        accountHolderName: { type: String, default: '', trim: true },
        accountNumber: { type: String, default: '', trim: true },
        ifsc: { type: String, default: '', trim: true, uppercase: true },
    },
    bills: [{
        originalName: { type: String, required: true },
        path: { type: String, required: true },
        mimeType: { type: String, default: 'image/jpeg' },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
    }],
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // PENDING -> (LX/Admin) APPROVED -> (Finance) PROCESSED. REJECTED is terminal.
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
        default: 'PENDING',
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    // Set when the Finance team marks the (already approved) claim as paid out.
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    processedAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    notes: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

ReimbursementSchema.index({ submittedBy: 1, status: 1 });
ReimbursementSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Reimbursement || mongoose.model('Reimbursement', ReimbursementSchema);
