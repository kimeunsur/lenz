const express = require('express');
const User = require('../models/User');
const router = express.Router();

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

module.exports = router;
