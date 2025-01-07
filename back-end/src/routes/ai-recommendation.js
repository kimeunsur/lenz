const { express, authMiddleware, Post } = require('../modules/common');
const { spawn } = require('child_process');
const router = express.Router();

// AI 추천 게시물 엔드포인트
router.post('/ai-recommendation-post-post',authMiddleware, async (req, res) => {
    try { 

        const userId = req.user.id;

        // req.user.id가 작성한 최근 5개 게시물 조회
        const recentPosts = await Post.find({userId})
            .sort({ createdAt: -1 }) // 최신순 정렬
            .limit(5) // 최근 5개
            .select('_id'); // _id만 선택


        const postIds = recentPosts.map(post => post._id.toString());

        // Python 스크립트 실행
        const pythonProcess = spawn('python3', ['post-post-ai.py', ...postIds]);

        let result = '';
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsedResult = JSON.parse(result); // Python 출력 결과를 JSON으로 파싱
                    // MongoDB 데이터 형식에 맞게 가공
                    const postsWithLikeCount = parsedResult.posts.map(post => ({
                        _id: post._id,
                        content: post.content,
                        likeCount: Math.floor(Math.random() * 100), // 임의의 likeCount 값 추가 (예시)
                        weight: Math.random() * 10 // 임의의 weight 값 추가 (예시)
                    }));

                    res.status(200).json({ posts: postsWithLikeCount }); // 최종 JSON 반환
                } catch (err) {
                    console.error('JSON 파싱 오류:', err);
                    res.status(500).json({ error: '결과 처리 중 오류 발생' });
                }
            } else {
                res.status(500).json({ error: `Python 스크립트가 종료 코드 ${code}로 실패했습니다.` });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 에러로 추천 게시물 생성 실패' });
    }
});

module.exports = router;