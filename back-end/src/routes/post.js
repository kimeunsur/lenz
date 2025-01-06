const { express, jwt, Post, Follow, authMiddleware, fs, path, sharp } = require('../modules/common');
const router = express.Router();
const Post = require('../models/Post'); // 글 DB 모델
const jwt = require('jsonwebtoken');
const Follow = require('../models/Follow'); // Follow 모델 가져오기
const sharp = require('sharp');
const multer = require('multer');

// Multer 설정
const upload = multer({
    dest: 'uploads/', // 업로드 디렉토리 설정
    limits: { fileSize: 50 * 1024 * 1024 }, // 파일 크기 제한 (50MB)
});

router.post('/post',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const { content, image } = req.body;
        if (!content) {
            return res.status(403).json({ error: 'content는 필수입니다.' });
        }

        let imagePath = '';
        const mime = require('mime-types'); // MIME 타입 처리 라이브러리
        if (image) {
            // Base64 데이터에서 MIME 타입과 데이터 분리
            const matches = image.match(/^data:(image\/\w+);base64,(.+)$/); // matches 변수 선언 및 할당
            if (!matches || matches.length !== 3) {
                throw new Error('잘못된 이미지 데이터 형식입니다.');
            }

            const detectedMimeType = matches[1]; // 파일의 MIME 타입 추출
            const base64Data = matches[2]; // Base64 데이터 추출
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
            if (!allowedMimeTypes.includes(detectedMimeType)) {
                throw new Error('허용되지 않는 파일 형식입니다.');
            }
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const extension = mime.extension(detectedMimeType); // 확장자 추출
            const buffer = Buffer.from(base64Data, 'base64');

            // Base64 데이터를 파일로 저장
            const uniqueName = `${Date.now()}.${extension}`;
            const uploadPath = path.join(uploadDir, uniqueName);


            // sharp로 이미지 크기 조정
            await sharp(buffer)
                .resize(1024, 1024, {
                    fit: sharp.fit.inside,
                    withoutEnlargement: true, // 원본 크기보다 확대 방지
                })
                .toFormat(extension === 'png' ? 'png' : 'jpeg') // 형식에 따라 처리
                .toFile(uploadPath);
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

// 특정 사용자의 게시물 가져오기
router.get('/user/:id/posts', async (req, res) => {
    try {
        const { id } = req.params; // URL에서 사용자 ID 추출

        // 해당 사용자의 게시물 불러오기 (최신순 정렬)
        const posts = await Post.find({ userId: id }).sort({ createdAt: -1 });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: '게시물이 없습니다.' });
        }

        res.status(200).json(posts);
    } catch (err) {
        console.error('특정 사용자 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});


// 모든 게시물 가져오기
router.get('/post/me',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const posts = await Post.find({ userId }).sort({ createdAt: -1 });// 사용자의 게시물 불러오기 (최신순 정렬)
        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err);
        res.status(500).json({ error: '서버 오류' });
    }
});


router.get('/post/following',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 팔로우 대상 목록 가져오기
        const following = await Follow.find({ followerId: userId }).select('followingId');
        //console.log('Following data:', following);
        const followingIds = following.map(f => f.followingId);

        // 팔로우한 유저의 게시물 100개 가져오기
        const posts = await Post.find({ userId: { $in: followingIds } }).sort({ createdAt: -1 }).limit(100);
        //console.log('Fetched posts:', posts);

        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;