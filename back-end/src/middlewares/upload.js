// middleware/upload.js
const multer = require('multer');
const path = require('path');

// 저장소 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        cb(null, uploadDir); // 파일 저장 경로
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // 저장 파일명
    }
});

// 파일 크기 제한 (10MB)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;