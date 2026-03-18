import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: [true, 'Please provide a filename'],
    },
    originalName: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['Bill', 'Report', 'Poster', 'Document', 'Other'],
        default: 'Other',
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
    semester: {
        type: String,
        default: 'Spring 2026',
    },
    tags: [{
        type: String,
    }],
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for searching
FileSchema.index({ filename: 'text', originalName: 'text', tags: 'text' });
FileSchema.index({ type: 1, semester: 1 });

export default mongoose.models.File || mongoose.model('File', FileSchema);
