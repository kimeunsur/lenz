const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const jwt = require('jsonwebtoken');

// 글 작성 Route
router.post('/post', async (req, res) => {
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
            if (!/^([A-Za-z0-9+/=]+)$/.test(image)) {
                throw new Error('잘못된 Base64 데이터입니다.');
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

        res.status(201).json({ message: '글이 성공적으로 작성되었습니다.', post: newPost });
    } catch (err) {
        console.error('서버 오류 발생:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
    }
});

module.exports = router;
