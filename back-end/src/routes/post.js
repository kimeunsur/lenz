const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const jwt = require('jsonwebtoken');
const Follow = require('../models/Follow'); // Follow 모델 가져오기
// 글 작성 Route
router.post('/post/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 없습니다.' });
        }

        // 토큰 검증 및 userId 추출
        const decoded = jwt.verify(token, 'secretKey');
        const userId = decoded.id;

        const { content, image } = req.body;
        if (!content) {
            return res.status(403).json({ error: 'content는 필수입니다.' });
        }

        let imagePath = '';
        if (image) {
            // uploads 디렉토리 존재 여부 확인 및 생성
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Base64 데이터 검증
            if (image && image.trim() !== '') {
                if (!/^([A-Za-z0-9+/=]+)$/.test(image)) {
                    throw new Error('잘못된 Base64 데이터입니다.');
                }
                // 나머지 로직 유지
            }

            // Base64 데이터를 파일로 저장
            const buffer = Buffer.from(image, 'base64');
            const uniqueName = `${Date.now()}.jpg`;
            const uploadPath = path.join(uploadDir, uniqueName);
            fs.writeFileSync(uploadPath, buffer);
            imagePath = `/uploads/${uniqueName}`;
        }

        // 글 DB에 저장
        const newPost = new Post({
            userId,
            content,
            image: imagePath,
        });
        await newPost.save();

        res.status(201).json({ 
            message: '글이 성공적으로 작성되었습니다.', 
            postId: newPost._id, // postId 추가
            post: newPost 
        });
    } catch (err) {
        console.error('서버 오류 발생:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
    }
});


// 모든 게시물 가져오기
router.get('/post', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const userId = decoded.id; // 토큰에서 추출된 userId

        // 사용자의 게시물 불러오기 (최신순 정렬)
        const posts = await Post.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err);
        res.status(500).json({ error: '서버 오류' });
    }
});


router.get('/post/following', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: '토큰이 필요합니다.' });
        }

        const decoded = jwt.verify(token, 'secretKey');
        const userId = decoded.id;

        // 팔로우 대상 목록 가져오기
        const following = await Follow.find({ followerId: userId }).select('followingId');
        console.log('Following data:', following);
        const followingIds = following.map(f => f.followingId);

        // 팔로우한 유저의 게시물 100개 가져오기
        const posts = await Post.find({ userId: { $in: followingIds } })
                                .sort({ createdAt: -1 })
                                .limit(100);
        console.log('Fetched posts:', posts);

        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;