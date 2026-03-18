import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please provide an expense title'],
    },
    description: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: 0,
    },
    category: {
        type: String,
        enum: ['Venue', 'Food', 'Equipment', 'Decoration', 'Prizes', 'Marketing', 'Other'],
        default: 'Other',
    },
    bills: [{
        filename: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    paidDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for queries
ExpenseSchema.index({ eventId: 1, status: 1 });
ExpenseSchema.index({ category: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
