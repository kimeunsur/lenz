const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 팔로우 하는 유저
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 팔로우 받는 유저
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Follow', followSchema);