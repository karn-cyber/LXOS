import mongoose from 'mongoose';

const ClanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a clan name'],
        unique: true,
        enum: ['Maratha', 'Vijaya', 'Chola', 'Rajputana'],
    },
    color: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        default: 0,
        min: 0,
    },
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
    semester: {
        type: String,
        required: true,
        default: 'Spring 2026',
    },
    description: {
        type: String,
        default: '',
    },
    pointHistory: [{
        points: {
            type: Number,
            required: true,
        },
        previousPoints: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        date: {
            type: Date,
            default: Date.now,
        },
    }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for budget remaining
ClanSchema.virtual('budgetRemaining').get(function () {
    return this.budgetAllocated - this.budgetSpent;
});

// Virtual for events
ClanSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'clanId',
});

export default mongoose.models.Clan || mongoose.model('Clan', ClanSchema);
