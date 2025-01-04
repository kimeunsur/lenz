const express = require('express');
const User = require('../models/User');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); 
//사진url 등록을 위해 아래 변수 추가
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// 파일 저장 설정 <- 얘도 추가함..
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

//기존 프로필 가져오기
router.get('/profile/me',authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // 비밀번호 제외하고 반환
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
          }
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: '서버 오류' });
    }
});


// 프로필 사진 업로드 엔드포인트
router.put(
    '/user/me/profile-picture',
    authMiddleware, 
    upload.single('profileImage'), // input[type="file"]의 name 값이 'profileImage'여야 함
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
        }
  
        // 업로드된 파일에 대한 URL 생성
        // 예시: http://localhost:5000/uploads/파일명
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
        // DB에 URL 저장
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { profileImage: fileUrl },
          { new: true }
        );
  
        if (!updatedUser) {
          return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
  
        // 성공 시, 업데이트된 유저의 profileImage(URL) 반환
        res.status(200).json({ profileImage: updatedUser.profileImage });
      } catch (error) {
        console.error('프로필 사진 업데이트 중 오류 발생:', error);
        res.status(500).json({ message: '프로필 사진 업데이트 중 오류가 발생했습니다.' });
      }
    }
  );
  
// 이름 변경 라우트
router.put('/user/me/name', authMiddleware, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: '이름이 필요합니다.' });
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { name },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
  
      res.status(200).json(updatedUser); // name 필드가 포함되어 있는 유저 객체
    } catch (error) {
      console.error('이름 변경 오류:', error);
      res.status(500).json({ message: '서버 오류' });
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

// 정적 파일 제공
const app = express();
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;

