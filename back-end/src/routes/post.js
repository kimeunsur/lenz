const { express, jwt, Post, Follow, authMiddleware, fs, path, sharp } = require('../modules/common');
const router = express.Router();
const mongoose = require('mongoose');
const Feed = require('../models/Feed');

const { getRecommendedPosts, getPostsSortedByLikes, getPostsSortedByFollowers, getPostsSortedByCoFollower, getPostsSortedByCoLiker } = require('./recommendation'); // 구조 분해 할당으로 함수 가져오기
const { updateUserFeed, feedScheduler } = require('../jobs/feedScheduler');
const upload = require('../middlewares/upload');

// 글 작성 하기
router.post('/post/me', authMiddleware, upload.single('image'), async (req, res) => {


    try {
        const userId = req.user.id;
        const { content } = req.body;

        if (!content) {
            return res.status(403).json({ error: 'content는 필수입니다.' });
        }

        let imagePath = '/uploads/default.jpeg'; // 기본 이미지 경로 설정
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;

        }

        const newPost = new Post({
            userId,
            content,
            image: imagePath,
        });
        await newPost.save();


        res.status(201).json({
            message: '글이 성공적으로 작성되었습니다.',
            postId: newPost._id,
            post: newPost,
        });
    } catch (err) {
        console.error('서버 오류 발생:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
    }
});

// 특정 사용자의 게시물 가져오기
router.get('/user/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
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
router.get('/post/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const posts = await Post.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 팔로우한 유저의 게시물 가져오기
router.get('/post/following', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const following = await Follow.find({ followerId: userId }).select('followingId');
        console.log('Following data:', following);
        const followingIds = following.map(f => f.followingId);
        console.log('Following IDs:', followingIds);
        const posts = await Post.find({ userId: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate({path: 'userId', select: 'name profileImage'});
        console.log('Fetched posts:', posts);

        res.status(200).json({ posts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
// 사용자별로 피드 가져오기; 프리로딩
router.get('/post/following/loading', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // JWT에서 파싱된 사용자 ID 사용
        await updateUserFeed(userId);
        const feed = await Feed.findOne({ userId }).populate({
            path: 'posts.postId',
            select: 'content image createdAt likes userId',
        });
        if (!feed) {
            return res.status(404).json({ message: 'Feed not found' });
        }

        res.json(feed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 좋아요 순
router.get('/post/sort-by-like', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendedPosts = await getPostsSortedByLikes(userId);
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 팔로워 순
router.get('/post/sort-by-followers', authMiddleware, async (req, res) => {
    try {
        const posts = await getPostsSortedByFollowers();
        res.status(200).json({ posts });
    } catch (err) {
        console.error('팔로워 순 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 팔로우 겹치는 순
router.get('/post/sort-by-coFollower', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendedPosts = await getPostsSortedByCoFollower(userId);
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 좋아요 겹치는 순
router.get('/post/sort-by-coLiker', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendedPosts = await getPostsSortedByCoLiker(userId);
        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 추천 게시물 가져오기
router.get('/post/recommendations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; 
        const recommendedPosts = await getRecommendedPosts(userId); 

        // 추천 게시물 ID로 실제 Post 데이터 조회
        const postIds = recommendedPosts.map(post => post.postId); 
        const posts = await Post.find({ _id: { $in: postIds } }).lean();

        // recommendationScore 추가 및 정렬
        const postsWithScores = posts.map(post => {
            const score = recommendedPosts.find(rp => rp.postId === post._id.toString()).recommendationScore;
            return { ...post, recommendationScore: score };
        }).sort((a, b) => b.recommendationScore - a.recommendationScore); // 점수 내림차순 정렬

        res.status(200).json({ posts: postsWithScores });

    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
