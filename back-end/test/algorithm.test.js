const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Feed = require('../src/models/Feed');
const connectDB = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { updateUserFeed, feedScheduler } = require('../src/jobs/feedScheduler'); // feedScheduler 임포트

describe('추천 게시물 API 테스트', () => {
    let token1, token2, userId1, userId2;

    beforeAll(async () => {
        require('dotenv').config();
        process.env.NODE_ENV = 'test';
        await connectDB();
        const db = mongoose.connection.getClient().db('testDatabase');
        await db.dropDatabase();

        // 유저1 회원가입 및 로그인
        const user1Res = await request(app).post('/register').send({ email: 'user1@a.com', password: 'pass1' });
        token1 = (await request(app).post('/login').send({ email: 'user1@a.com', password: 'pass1' })).body.token;
        userId1 = jwt.verify(token1, 'secretKey').id;

        // 유저2 회원가입 및 로그인
        const user2Res = await request(app).post('/register').send({ email: 'user2@a.com', password: 'pass2' });
        token2 = (await request(app).post('/login').send({ email: 'user2@a.com', password: 'pass2' })).body.token;
        userId2 = jwt.verify(token2, 'secretKey').id;

        // 유저2가 유저1을 팔로우
        await request(app).post(`/follow/${userId1}`).set('Authorization', `Bearer ${token2}`);

        // 유저1 게시글 작성
        await request(app)
            .post('/post/me')
            .set('Authorization', `Bearer ${token1}`)
            .send({ content: '유저1의 첫 번째 게시글', image: '' });
        await request(app)
            .post('/post/me')
            .set('Authorization', `Bearer ${token1}`)
            .send({ content: '유저1의 두 번째 게시글', image: '' });

        // 피드 프리로딩 실행 (스케줄러 대체)
        const posts = await request(app).get('/post/following').set('Authorization', `Bearer ${token2}`);
        const feedData = posts.body.posts.map(post => ({
            postId: post._id,
            createdAt: post.createdAt,
        }));
        await Feed.updateOne(
            { userId: userId2 },
            { posts: feedData, updatedAt: new Date() },
            { upsert: true }
        );
    });

    afterAll(async () => {
        const db = mongoose.connection.getClient().db('testDatabase');
        await db.dropDatabase();
        await mongoose.connection.close();
    });

    test('캐시된 피드 데이터를 반환', async () => {
        const res = await request(app).get('/post/following/loading').set('Authorization', `Bearer ${token2}`);
        console.log('Response status:', res.status);
        console.log('Response body:', res.body);
        
        expect(res.status).toBe(200);
        expect(res.body.posts).toBeDefined();
        expect(res.body.posts).toHaveLength(2); // 유저1이 작성한 2개의 게시글
        expect(res.body.posts[0].postId.content).toBe('유저1의 두 번째 게시글');
        expect(res.body.posts[1].postId.content).toBe('유저1의 첫 번째 게시글');
    });

    test('실시간 데이터와 프리로딩 데이터 일치 여부 확인', async () => {
        await updateUserFeed(userId2); // 수정: 프리로딩 데이터 강제 업데이트

        const liveRes = await request(app).get('/post/following').set('Authorization', `Bearer ${token2}`);
        const preloadedRes = await request(app).get('/post/following/loading').set('Authorization', `Bearer ${token2}`);

        console.log('실시간 데이터 상태:', liveRes.status);
        console.log('실시간 데이터:', liveRes.body.posts);
        console.log('프리로딩 데이터 상태:', preloadedRes.status);
        console.log('프리로딩 데이터:', preloadedRes.body.posts);
    
    // 프리로딩 데이터를 실시간 데이터와 동일한 구조로 변환
    const transformedPreloadedPosts = preloadedRes.body.posts.map(post => ({
        _id: post.postId._id,
        content: post.postId.content,
        image: post.postId.image,
        createdAt: post.postId.createdAt,
        likes: post.postId.likes,
        userId: post.postId.userId,
        __v: post.postId.__v || 0, // __v 필드 추가, 없을 경우 기본값 0
    }));

    console.log('변환된 프리로딩 데이터:', transformedPreloadedPosts);


        expect(liveRes.status).toBe(200);
        expect(preloadedRes.status).toBe(200);
        
        expect(transformedPreloadedPosts).toEqual(liveRes.body.posts); // 실시간 데이터와 프리로딩 데이터가 동일해야 함
    });
});