import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null,
    },
    title: {
        type: String,
        required: [true, 'Please provide a booking title'],
    },
    startTime: {
        type: Date,
        required: [true, 'Please provide a start time'],
    },
    endTime: {
        type: Date,
        required: [true, 'Please provide an end time'],
    },
    purpose: {
        type: String,
        required: true,
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING',
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
}, {
    timestamps: true,
});

// Index for conflict detection
BookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

// Validate end time is after start time
BookingSchema.pre('save', function (next) {
    // Skip validation if times aren't set
    if (!this.startTime || !this.endTime) {
        return next();
    }

    // Convert to timestamps for accurate comparison
    const startTimestamp = new Date(this.startTime).getTime();
    const endTimestamp = new Date(this.endTime).getTime();

    // End must be after start
    if (endTimestamp <= startTimestamp) {
        return next(new Error('End time must be after start time'));
    }

    next();
});

// Delete any cached model to force recreation with new middleware
delete mongoose.models.Booking;

export default mongoose.model('Booking', BookingSchema);
