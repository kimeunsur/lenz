const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 홈 화면의 사용자
    posts: [{
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // 게시글
        createdAt: { type: Date, required: true }, // 게시글 작성 시간
    }],
    updatedAt: { type: Date, default: Date.now } // 마지막으로 피드가 업데이트된 시간
});

module.exports = mongoose.model('Feed', feedSchema);