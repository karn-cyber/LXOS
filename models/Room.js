import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a room name'],
        unique: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['Auditorium', 'Classroom', 'Hall', 'Lab', 'Conference Room', 'Other'],
        default: 'Other',
    },
    capacity: {
        type: Number,
        required: [true, 'Please provide room capacity'],
        min: 1,
    },
    facilities: [{
        type: String,
    }],
    location: {
        type: String,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for searching
RoomSchema.index({ name: 1, type: 1 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
