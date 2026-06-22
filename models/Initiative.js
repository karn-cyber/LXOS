import mongoose from 'mongoose';

const InitiativeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an initiative title'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    clanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clan',
        required: true,
    },
    // Which semester the initiative ran in (free text, e.g. "Holi 2026").
    semester: {
        type: String,
        default: '',
        trim: true,
    },
    status: {
        type: String,
        enum: ['PLANNING', 'ACTIVE', 'COMPLETED'],
        default: 'ACTIVE',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

InitiativeSchema.index({ clanId: 1, semester: 1 });

export default mongoose.models.Initiative || mongoose.model('Initiative', InitiativeSchema);
