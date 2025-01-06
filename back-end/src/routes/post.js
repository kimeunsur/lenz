const { express, jwt, Post, Follow, authMiddleware, fs, path, sharp} = require('../modules/common');
const router = express.Router();
const mongoose = require('mongoose');


// 글 작성 하기
router.post('/post',authMiddleware, async (req, res) => {
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
        const posts = await Post.aggregate([
            {
                $addFields: {
                    likeCount: { $size: "$likes" },
                    weight: {
                        $add: [
                            { $size: "$likes" },
                            {
                                $divide: [
                                    { $subtract: [new Date(), "$createdAt"] },
                                    1000 * 60 * 60 * 24 // 하루 단위로 나눔
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { weight: -1, createdAt: -1 } }, // 가중치 -> 생성 시간 순으로 정렬
            { $limit: 100 }
        ]);

        // 유저 팔로워 수 계산 및 추가 정렬
        const populatedPosts = await Promise.all(
            posts.map(async (post) => {
                const followerCount = await Follow.countDocuments({ followingId: post.userId });
                return { ...post, followerCount };
            })
        );

        // 가중치 -> 생성 시간 -> 팔로워 수 순으로 최종 정렬
        populatedPosts.sort((a, b) => {
            if (a.weight !== b.weight) return b.weight - a.weight;
            if (a.createdAt !== b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
            return b.followerCount - a.followerCount;
        });

        res.status(200).json({ posts: populatedPosts });
    } catch (err) {
        console.error('게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//팔로워 순
router.get('/post/sort-by-followers', authMiddleware, async (req, res) => {
    try {
        // 유저별 팔로워 수 집계
        const posts = await Post.aggregate([
            {
                $lookup: {
                    from: 'follows',
                    localField: 'userId',
                    foreignField: 'followingId',
                    as: 'followerInfo'
                }
            },
            { $addFields: { 
                followerCount: { $size: "$followerInfo" },
                likeCount: { $size: "$likes" }
            } },
            {
                $project: {
                    content: 1,
                    image: 1,
                    createdAt: 1,
                    followerCount: 1,
                    likeCount: 1
                }
            },
            { $sort: { followerCount: -1, createdAt: -1, likeCount: -1 } }, // 정렬 기준: 팔로워 수 > 시간 > 좋아요
            { $limit: 100 }
        ]);

        res.status(200).json({ posts });
    } catch (err) {
        console.error('팔로워 순 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//팔로우 겹치는 순, 상위 10명의 게시물 2개, 하위 40명의 게시물 1개
router.get('/post/sort-by-coFollower', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 내가 팔로우하는 유저 목록 가져오기
        const followingUsers = await Follow.find({ followerId: userId }).select('followingId');
        const followingIds = followingUsers.map(follow => follow.followingId);
        //console.log('Following users:', followingIds);
        // 2. 내가 팔로우하지 않는 유저 중 겹치는 팔로워가 많은 유저 집계
        const popularUsers = await Follow.aggregate([
            { 
                $match: { 
                    followerId: { $in: followingIds, $ne: userId }, // 내가 팔로우하는 사람의 팔로워
                    followingId: { $nin: followingIds, $ne: userId } // 내가 팔로우하지 않는 유저와 본인 제외
                } 
            },
            { $group: { _id: '$followingId', followerCount: { $sum: 1 } } }, // followingId별로 팔로워 수 집계
            { $sort: { followerCount: -1 } }, // 팔로워 수 기준으로 정렬
            { $limit: 50 } // 상위 50명 제한
        ]);
        //console.log('Popular users:', popularUsers);
        const popularUserIds = popularUsers
            .filter(user => user._id.toString() !== userId.toString()) // userId와 같은 ID 제외
            .map(user => user._id);

        // 3. 상위 유저와 하위 유저 분리
        const topUsers = popularUserIds.slice(0, 10); // 상위 유저
        const lowerUsers = popularUserIds.slice(10); // 하위 유저

        // 4. 유저별로 게시물 가져오기
        const topUserPosts = [];
        for (const userId of topUsers) {
            const posts = await Post.find({ userId }) // 유저의 게시물
                .sort({ createdAt: -1 }) // 최신순 정렬
                .limit(2); // 최대 2개
            topUserPosts.push(...posts);
        }
        console.log('Top user posts:', topUserPosts);
        const lowerUserPosts = [];
        for (const userId of lowerUsers) {
            const posts = await Post.find({ userId })
                .sort({ createdAt: -1 })
                .limit(1); // 최대 1개
            lowerUserPosts.push(...posts);
        }

        // 5. 게시물 병합 및 반환
        const recommendedPosts = [...topUserPosts, ...lowerUserPosts].slice(0, 50); // 총 50개로 제한

        res.status(200).json({ posts: recommendedPosts });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
//좋아요 겹치는 순, 상위 30명의 게시물 50개
router.get('/post/sort-by-coLiker', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 내가 좋아요 누른 최근 100개의 게시물 가져오기
        const recentLikedPosts = await Post.find({ likes: userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .select('_id likes');

        // 2. 좋아요가 겹친 사용자 계산
        const userLikeCounts = {};
        recentLikedPosts.forEach(post => {
            post.likes.forEach(likedUserId => {
                if (likedUserId.toString() !== userId.toString()) { // 본인 제외
                    userLikeCounts[likedUserId] = (userLikeCounts[likedUserId] || 0) + 1;
                }
            });
        });

        // 3. 좋아요 겹친 사용자 상위 30명 추출
        const topUsers = Object.entries(userLikeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 30)
            .map(([userId]) => new mongoose.Types.ObjectId(userId));

        // 4. 상위 유저들이 좋아요를 누른 게시물들 가져오기 및 likeCount 추가
        const postsWithLikeCount = await Post.aggregate([
            {
                $match: {
                    likes: { $elemMatch: { $in: topUsers } },
                    userId: { $ne: new mongoose.Types.ObjectId(userId) },
                    _id: { $nin: recentLikedPosts.map(post => post._id) }
                }
            },
            {
                $addFields: {
                    likeCount: {
                        $size: {
                            $setIntersection: ["$likes", topUsers]
                        }
                    }
                }
            },
            { $sort: { likeCount: -1, createdAt: -1 } },
            { $limit: 50 }
        ]);

        // 5. 추천 게시물 반환
        res.status(200).json({ posts: postsWithLikeCount });
    } catch (err) {
        console.error('추천 게시물 가져오기 오류:', err.message);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;