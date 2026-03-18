import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['ADMIN', 'LX_TEAM', 'CLUB_HEAD', 'CLAN_HEAD', 'FINANCE'],
        default: 'CLUB_HEAD',
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: function () {
            return this.role === 'CLUB_HEAD';
        },
    },
    clanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clan',
        required: function () {
            return this.role === 'CLAN_HEAD';
        },
    },
    avatar: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Delete any cached model to force recreation with new middleware
delete mongoose.models.User;

export default mongoose.model('User', UserSchema);
