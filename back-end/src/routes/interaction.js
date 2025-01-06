const { express, jwt, User, Post, Notification, Follow, authMiddleware } = require('../modules/common');
const router = express.Router();

// 좋아요 Route
router.post('/post/:postId/like', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // 토큰에서 추출한 유저 ID
        const { postId } = req.params; // URL에서 postId 추출

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
        }

        let message;
        if (post.likes.includes(userId)) {
            // 좋아요 취소
            post.likes = post.likes.filter(id => id !== userId);
            message = '좋아요가 취소되었습니다.';
        } else {
            // 좋아요 추가
            post.likes.push(userId);
            message = '좋아요가 추가되었습니다.';

            // 좋아요 알림 생성
            await new Notification({
                userId: post.userId, // 글 작성자
                type: 'like',
                fromUserId: userId, // 좋아요를 누른 사용자
                postId: postId,
            }).save();
        }

        await post.save();
        res.status(200).json({ message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

router.post('/follow/:followingId', authMiddleware, async (req, res) => {
    try {
        const followerId = req.user.id; // 토큰에서 추출된 유저 ID
        const { followingId } = req.params;
        if (followerId === followingId) {
            return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
        }
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({ error: '이미 팔로우 중입니다.' });
        }

        // 팔로우 관계 저장
        const newFollow = new Follow({ followerId, followingId });
        await newFollow.save();

        res.status(200).json({ message: '팔로우 성공!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});

router.delete('/unfollow/:followingId', authMiddleware, async (req, res) => {
    try {
        const followerId = req.user.id; // 토큰에서 추출한 followerId
        const { followingId } = req.params;

        if (followerId === followingId) {
            return res.status(400).json({ error: '자기 자신을 언팔로우할 수 없습니다.' });
        }

        // 언팔로우 관계 확인
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (!existingFollow) {
            return res.status(400).json({ error: '팔로우 상태가 아닙니다.' });
        }

        // 팔로우 관계 삭제
        await Follow.deleteOne({ followerId, followingId });

        res.status(200).json({ message: '언팔로우 성공!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    }
});


router.get('/user/me/follow-stats',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 팔로워 수 계산 (followingId가 userId인 경우)
        const followerCount = await Follow.countDocuments({ followingId: userId });

        // 팔로잉 수 계산 (followerId가 userId인 경우)
        const followingCount = await Follow.countDocuments({ followerId: userId });

        // 결과 반환
        res.status(200).json({
            followerCount,
            followingCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로우 통계 조회 중 오류가 발생했습니다.' });
    }
});


router.get('/user/:id/follow-stats', async (req, res) => {
    try {
      const { id } = req.params;
  
      // 팔로워 수 계산 (followingId가 상대 사용자의 ID인 경우)
      const followerCount = await Follow.countDocuments({ followingId: id });
  
      // 팔로잉 수 계산 (followerId가 상대 사용자의 ID인 경우)
      const followingCount = await Follow.countDocuments({ followerId: id });
  
      res.status(200).json({ followerCount, followingCount });
    } catch (error) {
      console.error('팔로우 통계 조회 오류:', error);
      res.status(500).json({ error: '팔로우 통계 조회 중 오류가 발생했습니다.' });
    }
  });
  

router.get('/user/posts/count', authMiddleware, async (req, res) => {
    try {
        // 쿼리 파라미터에서 userId 확인
        const requestedUserId = req.query.userId;
        let userId;

        if (requestedUserId) {
            // 쿼리 파라미터에 userId가 포함된 경우
            userId = requestedUserId;
        } else {
            userId = req.user.id;
        }

        // 해당 userId의 게시물 수 카운트
        const postCount = await Post.countDocuments({ userId });

        // 결과 반환
        res.status(200).json({ postCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '게시물 수 조회 중 오류가 발생했습니다.' });
    }
});

router.get('/user/me/followers',authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const followers = await Follow.find({ followingId: userId })
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(50)
            .select('followerId'); // followerId만 선택
        //console.log(followers)
        const followerIds = followers.map(f => f.followerId);

        res.status(200).json({ followers: followerIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로워 목록 조회 중 오류 발생' });
    }
});

router.get('/user/me/following', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const following = await Follow.find({ followerId: userId })
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(50)
            .select('followingId'); // followingId만 선택

        const followingIds = following.map(f => f.followingId);

        res.status(200).json({ following: followingIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '팔로잉 목록 조회 중 오류 발생' });
    }
});

router.get('/user/:id/name', async (req, res) => {
    try {
        const { id } = req.params; // URL에서 userId 추출

        const user = await User.findById(id).select('name'); // userId로 유저 검색, name 필드만 반환
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }

        res.status(200).json({ name: user.name }); // name 반환
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '유저 이름 조회 중 오류 발생' });
    }
});



module.exports = router;