const mongoose = require('mongoose');
const {Schema} = mongoose;

const dailyChallengeSchema = new Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    dayNumber: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const DailyChallenge = mongoose.model('dailyChallenge', dailyChallengeSchema);

module.exports = DailyChallenge;

