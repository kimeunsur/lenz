const { express, jwt, User, authMiddleware } = require('../modules/common');
const bcrypt = require('bcryptjs');
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: '이메일과 비밀번호를 모두 입력하세요.' });
        }

        // 유저네임 중복 확인
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: '이미 존재하는 유저네임입니다.' });
        }

        // 새 유저 생성
        const newUser = new User({ email, password, profileImage: "http://localhost:3000/uploads/default.jpeg" });

        await newUser.save();

        res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 에러로 회원가입 실패' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '로그인 실패' });
        }
        const token = jwt.sign({ id: user._id }, 'secretKey');
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
