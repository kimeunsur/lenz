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
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});


router.get('/user/me/follow-stats', async (req, res) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        // 토큰 디코딩 및 userId 추출
        const decoded = jwt.verify(token, "secretKey");
        const userId = decoded.id;

        // 팔로워 수 계산 (followingId가 userId인 경우)
        const followerCount = await Follow.countDocuments({ followingId: userId });

        // 팔로잉 수 계산 (followerId가 userId인 경우)
        const followingCount = await Follow.countDocuments({ followerId: userId });

        // 결과 반환
        res.status(200).json({
            followerCount,
            followingCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로우 통계 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/user/posts/count', async (req, res) => {
    try {
        // 쿼리 파라미터에서 userId 확인
        const requestedUserId = req.query.userId;

        let userId;

        if (requestedUserId) {
            // 쿼리 파라미터에 userId가 포함된 경우
            userId = requestedUserId;
        } else {
            // Authorization 헤더에서 토큰 추출 및 userId 디코딩
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: '토큰이 필요합니다.' });
            }

            const decoded = jwt.verify(token, "secretKey");
            userId = decoded.id;
        }

        // 해당 userId의 게시물 수 카운트
        const postCount = await Post.countDocuments({ userId });

        // 결과 반환
        res.status(200).json({ postCount });
    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: '잘못된 토큰입니다.' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '토큰이 만료되었습니다.' });
        } else if (error.name === 'CastError') {
            return res.status(400).json({ error: '유효하지 않은 userId입니다.' });
        }
        res.status(500).json({ error: '게시물 수 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/user/me/followers', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const userId = decoded.id;

        const followers = await Follow.find({ followingId: userId })
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(50)
            .select('followerId'); // followerId만 선택
        console.log(followers)
        const followerIds = followers.map(f => f.followerId);

        res.status(200).json({ followers: followerIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로워 목록 조회 중 오류 발생' });
    }
});

router.get('/user/me/following', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const userId = decoded.id;

        const following = await Follow.find({ followerId: userId })
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(50)
            .select('followingId'); // followingId만 선택

        const followingIds = following.map(f => f.followingId);

        res.status(200).json({ following: followingIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로잉 목록 조회 중 오류 발생' });
    }
});

router.get('/user/:id/name', async (req, res) => {
    try {
        const { id } = req.params; // URL에서 userId 추출

        const user = await User.findById(id).select('name'); // userId로 유저 검색, name 필드만 반환
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }

        res.status(200).json({ name: user.name }); // name 반환
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '유저 이름 조회 중 오류 발생' });
    }
});



module.exports = router;