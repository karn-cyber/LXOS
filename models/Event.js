import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an event title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    type: {
        type: String,
        enum: ['CLUB', 'CLAN', 'LX'],
        required: true,
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: function () {
            return this.type === 'CLUB';
        },
    },
    clanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clan',
        required: function () {
            return this.type === 'CLAN';
        },
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date'],
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null,
    },
    requirements: [{
        item: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        estimatedCost: {
            type: Number,
            default: 0,
        },
    }],
    budgetAllocated: {
        type: Number,
        default: 0,
        min: 0,
    },
    budgetSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    approvedAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    attendees: {
        type: Number,
        default: 0,
    },
    poster: {
        type: String,
        default: null,
    },
    clanScores: {
        type: Map,
        of: Number,
        default: {},
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for budget remaining
EventSchema.virtual('budgetRemaining').get(function () {
    return this.budgetAllocated - this.budgetSpent;
});

// Index for calendar queries
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ type: 1, status: 1 });

// Note: Date validation is handled in the API route to avoid middleware issues
// The API route checks: if (new Date(endDate) < new Date(startDate)) { return error; }

// Delete any cached model to force recreation with new middleware
delete mongoose.models.Event;

export default mongoose.model('Event', EventSchema);
