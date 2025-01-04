// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const register = async (req, res) => {
//   try { 
//     const { username, password } = req.body;

//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ username, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: '회원가입 성공' });
//   } catch (error) {
//     res.status(500).json({ message: '서버 오류' });
//   }
// };


// const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     const user = await User.findOne({ username });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: '로그인 실패' });
//     }

//     const token = jwt.sign({ id: user._id }, 'secretKey', { expiresIn: '1h' });
//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: '서버 오류' });
//   }
// };

// module.exports = { register, login };