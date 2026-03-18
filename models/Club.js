import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a club name'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    logo: {
        type: String,
        default: null,
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
    isActive: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'Other'],
        default: 'Other',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for budget remaining
ClubSchema.virtual('budgetRemaining').get(function () {
    return this.budgetAllocated - this.budgetSpent;
});

// Virtual for events
ClubSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'clubId',
});

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
