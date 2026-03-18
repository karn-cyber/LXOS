import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an achievement title'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null,
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        default: null,
    },
    clanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clan',
        default: null,
    },
    points: {
        type: Number,
        default: 0,
        min: 0,
    },
    achievedDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    semester: {
        type: String,
        required: true,
        default: 'Spring 2026',
    },
    category: {
        type: String,
        enum: ['Academic', 'Sports', 'Cultural', 'Technical', 'Social', 'Other'],
        default: 'Other',
    },
    participants: [{
        type: String,
    }],
    images: [{
        type: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for searching
AchievementSchema.index({ title: 'text', description: 'text' });
AchievementSchema.index({ semester: 1, category: 1 });

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
