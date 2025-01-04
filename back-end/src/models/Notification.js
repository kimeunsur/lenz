const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 알림을 받는 유저
    type: { type: String, enum: ['follow', 'new_post', 'like'], required: true }, // 알림 종류
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 알림을 발생시킨 유저
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // 관련된 글 (optional)
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false } // 읽음 여부
});

module.exports = mongoose.model('Notification', notificationSchema);