const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        res.status(400).json({ error: '회원가입 실패' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '로그인 실패' });
        }
        const token = jwt.sign({ id: user._id }, 'secretKey', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;