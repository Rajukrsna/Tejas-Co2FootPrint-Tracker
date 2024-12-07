const mongoose = require('mongoose');

const earnedBadgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    points: { type: Number, default: 0 },
    googleId: String,
    earned_badges: { type: [earnedBadgeSchema], default: [] }
});

module.exports = mongoose.model('User', userSchema);
