const { express, jwt, Post, Follow, authMiddleware, fs, path, sharp} = require('../modules/common');
const router = express.Router();
const mongoose = require('mongoose');
const { getRecommendedPosts, getPostsSortedByLikes, getPostsSortedByFollowers, getPostsSortedByCoFollower, getPostsSortedByCoLiker } = require('./recommendation'); // 구조 분해 할당으로 함수 가져오기
// 글 작성 하기
router.post('/post/me',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

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


            // sharp로 이미지 크기 조정
            await sharp(buffer)
                .resize(1024, 1024, {
                    fit: sharp.fit.inside,
                    withoutEnlargement: true, // 원본 크기보다 확대 방지
                })
                .toFormat('jpeg')
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


//좋아요 순
router.get('/post/sort-by-like', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // authMiddleware를 통해 유저 ID 가져옴
        const recommendedPosts = await getPostsSortedByLikes(userId); // 추천 게시물 가져오기
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//팔로워 순
router.get('/post/sort-by-followers', authMiddleware, async (req, res) => {
    try {
        const posts = await getPostsSortedByFollowers(); // 함수 호출
        res.status(200).json({ posts });
    } catch (err) {
        console.error('팔로워 순 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//팔로우 겹치는 순, 상위 10명의 게시물 2개, 하위 40명의 게시물 1개
router.get('/post/sort-by-coFollower', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // authMiddleware를 통해 유저 ID 가져옴
        const recommendedPosts = await getPostsSortedByCoFollower(userId);
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//좋아요 겹치는 순, 상위 30명의 게시물 50개
router.get('/post/sort-by-coLiker', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // authMiddleware를 통해 유저 ID 가져옴
        const recommendedPosts = await getPostsSortedByCoLiker(userId);
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

router.get('/post/recommendations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // authMiddleware를 통해 유저 ID 가져옴
        const recommendedPosts = await getRecommendedPosts(userId); // 추천 게시물 가져오기
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;