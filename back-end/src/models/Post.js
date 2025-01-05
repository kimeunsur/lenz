const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    image: { type: String, default: '' }, // 글에 첨부된 이미지
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 좋아요한 유저 ID 목록
    createdAt: { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('Post', postSchema);