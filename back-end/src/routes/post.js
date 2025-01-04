const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const Follow = require('../models/Follow'); // 팔로우 DB 모델
const Notification = require('../models/Notification'); // 알림함 DB 모델

// 글 작성 Route
router.post('/post', async (req, res) => {
    try {
        const { userId, content, image } = req.body; // 작성자 ID, 글 내용, 첨부 이미지

        // 글 DB에 저장
        const newPost = new Post({
            userId,
            content,
            image: image || '' // 이미지가 없으면 빈 문자열
        });
        await newPost.save();

        // 팔로워 목록 조회
        const followers = await Follow.find({ followingId: userId }).select('followerId');

        // 알림 생성 (팔로워들에게 새 글 알림)
        const notifications = followers.map(follower => ({
            userId: follower.followerId, // 팔로워 ID
            type: 'new_post',
            fromUserId: userId, // 글 작성자 ID
            postId: newPost._id // 새로 작성된 글 ID
        }));

        // 알림함 DB에 알림 저장
        await Notification.insertMany(notifications);

        res.status(201).json({ message: '글이 성공적으로 작성되었습니다.', postId: newPost._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;