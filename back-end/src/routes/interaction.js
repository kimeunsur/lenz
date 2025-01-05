const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const Notification = require('../models/Notification'); // 알림함 DB 모델
const User = require('../models/User'); // 유저 DB 모델
const Follow = require('../models/Follow'); // 팔로우 DB 모델
const jwt = require('jsonwebtoken');

// 좋아요 Route
router.post('/post/:postId/like', async (req, res) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        // 토큰 디코딩 및 userId 추출
        const decoded = jwt.verify(token, "secretKey");
        const userId = decoded.id;

        const { postId } = req.params; // URL에서 postId 추출

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


router.post('/follow/:followingId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const followerId = decoded.id; // 토큰에서 추출된 유저 ID

        const { followingId } = req.params;
        if (followerId === followingId) {
            return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
        }

        // 팔로우 관계 저장
        const newFollow = new Follow({ followerId, followingId });
        await newFollow.save();

        res.status(200).json({ message: '팔로우 성공!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

router.delete('/unfollow/:followingId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const followerId = decoded.id; // 토큰에서 추출한 followerId

        const { followingId } = req.params;

        if (followerId === followingId) {
            return res.status(400).json({ error: '자기 자신을 언팔로우할 수 없습니다.' });
        }

        // 언팔로우 관계 확인
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (!existingFollow) {
            return res.status(400).json({ error: '팔로우 상태가 아닙니다.' });
        }

        // 팔로우 관계 삭제
        await Follow.deleteOne({ followerId, followingId });

        res.status(200).json({ message: '언팔로우 성공!' });
    } catch (err) {
        console.error('Error in /unfollow route:', err.message);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;