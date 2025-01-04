const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/profile/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // 비밀번호 제외하고 반환
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: '서버 오류' });
    }
});

router.put('/user/:id/name', async (req, res) => {
    const { id } = req.params; // URL에서 유저 ID 가져옴
    const { name } = req.body; // 요청 바디에서 이름 가져옴

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        // 유저 이름 업데이트
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name },
            { new: true } // 업데이트된 문서 반환
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser); // 업데이트 결과 반환
    } catch (error) {
        res.status(500).json({ message: 'Error updating name', error });
    }
});

router.put('/user/:id/profile-picture', async (req, res) => {
    const { id } = req.params;
    const { profileImage } = req.body;

    if (!profileImage) {
        return res.status(400).json({ message: 'Profile picture is required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { profileImage },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // profileImage만 반환
        res.status(200).json({ profileImage: updatedUser.profileImage });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile picture', error });
    }
});

router.get('/token', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // 헤더에서 토큰 추출
        if (!token) {
            return res.status(400).json({ error: '토큰이 제공되지 않았습니다.' });
        }

        // 토큰 디코딩
        const decoded = jwt.verify(token, 'secretKey'); // 'secretKey'는 JWT 생성 시 사용한 키
        res.status(200).json({ id: decoded.id, message: '토큰이 유효합니다.' });
    } catch (err) {
        res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
});

module.exports = router;

