const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const Notification = require('../models/Notification'); // 알림함 DB 모델
const User = require('../models/User'); // 유저 DB 모델
const Follow = require('../models/Follow'); // 팔로우 DB 모델



// 좋아요 Route
router.post('/like', async (req, res) => {
    try {
        const { postId, userId } = req.body; // 좋아요할 글 ID와 현재 사용자 ID

        // 글 찾기
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
        }

        // 이미 좋아요를 눌렀는지 확인
        if (post.likes.includes(userId)) {
            return res.status(400).json({ error: '이미 좋아요를 눌렀습니다.' });
        }

        // 글 DB에 좋아요 추가
        post.likes.push(userId);
        await post.save();

        // 글 작성자에게 알림 생성
        const notification = new Notification({
            userId: post.userId, // 글 작성자
            type: 'like',
            fromUserId: userId, // 좋아요를 누른 사용자
            postId: postId,
        });
        await notification.save();

        res.status(200).json({ message: '좋아요가 추가되었습니다.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});


router.post('/follow', async (req, res) => {
    try {
        const { followerId, followingId } = req.body; // 팔로우 하는 사용자와 팔로우 받는 사용자 ID

        // 자기 자신을 팔로우하려고 하면 오류 반환
        if (followerId === followingId) {
            return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
        }

        // 이미 팔로우 중인지 확인
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({ error: '이미 팔로우 중입니다.' });
        }

        // 팔로우 관계 생성
        const follow = new Follow({ followerId, followingId });
        await follow.save();

        // 팔로우 받은 사용자에게 알림 생성
        const notification = new Notification({
            userId: followingId, // 알림을 받는 사용자 (팔로우 받은 사용자)
            type: 'follow',
            fromUserId: followerId // 팔로우 한 사용자
        });
        await notification.save();

        res.status(200).json({ message: '팔로우 성공!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;