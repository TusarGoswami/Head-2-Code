const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20
    },
    lastName: {
        type: String,
        minLength: 3,
        maxLength: 20,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 6,
        max: 80,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    problemSolved: [{
        type: Schema.Types.ObjectId,
        ref: 'problem'
    }],
    password: {
        type: String,
        required: true
    },
    // Profile fields
    bio: {
        type: String,
        maxLength: 500,
        default: ''
    },
    location: {
        type: String,
        maxLength: 100,
        default: ''
    },
    college: {
        type: String,
        maxLength: 200,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    profilePicturePublicId: {
        type: String,
        default: ''
    },
    // Achievement/Badge system
    unlockedBadges: [{
        badgeId: {
            type: String,
            required: true
        },
        unlockedAt: {
            type: Date,
            default: Date.now
        },
        notificationSeen: {
            type: Boolean,
            default: false
        }
    }],
    totalPoints: {
        type: Number,
        default: 0
    },
    badgeProgress: {
        type: Map,
        of: Number,
        default: new Map() // Track progress towards locked badges
    },
    // Social links
    githubId: {
        type: String,
        maxLength: 100,
        default: ''
    },
    linkedinId: {
        type: String,
        maxLength: 100,
        default: ''
    }
}, {
    timestamps: true
});

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
        await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});


const User = mongoose.model("user", userSchema);

module.exports = User;
