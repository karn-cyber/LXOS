import mongoose from 'mongoose';

const ApprovalSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['EVENT', 'BOOKING', 'EXPENSE', 'BUDGET'],
        required: true,
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityModel',
    },
    entityModel: {
        type: String,
        required: true,
        enum: ['Event', 'Booking', 'Expense', 'Club', 'Clan'],
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    },
    comments: {
        type: String,
        default: '',
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    approvedAt: {
        type: Date,
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM',
    },
}, {
    timestamps: true,
});

// Indexes for queries
ApprovalSchema.index({ status: 1, createdAt: -1 });
ApprovalSchema.index({ type: 1, status: 1 });
ApprovalSchema.index({ requestedBy: 1 });

export default mongoose.models.Approval || mongoose.model('Approval', ApprovalSchema);
