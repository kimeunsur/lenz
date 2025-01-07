const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const connectDB = require('../src/config/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

describe('AI가 글 잘 추천하나 확인', () => {
  let token1, token2, token3, userId1, userId2, userId3;  // 토큰, 게시글 아이디, 유저 아이디
  let user1PostIds = [], user2PostIds = [];  // 유저1, 유저2 게시글 아이디 배열 
  beforeAll(async () => {
    //console.log('테스트 DB 초기화');
    require('dotenv').config();
    process.env.NODE_ENV = 'test';
    await connectDB();
    const db = mongoose.connection.getClient().db('testDatabase');
    await db.dropDatabase();
  });

  afterAll(async () => {
    //console.log('테스트 DB 삭제 및 연결 해제');
    const db = mongoose.connection.getClient().db('testDatabase'); // 다시 db 객체 가져오기
    await db.dropDatabase(); // DB 삭제
    await mongoose.connection.close(); // 연결 해제
  });

  test('유저1 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user1@a.com', password: 'pass1' });
    //console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ email: 'user1@a.com', password: 'pass1' });
    //console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token1 = loginRes.body.token;
    userId1 = jwt.verify(token1, 'secretKey').id;
  });

  test('유저2 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user2@a.com', password: 'pass2' });
    //console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ email: 'user2@a.com', password: 'pass2' });
    //console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token2 = loginRes.body.token;
    userId2 = jwt.verify(token2, 'secretKey').id;
  });

  test('유저3 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user3@a.com', password: 'pass3' });
    //console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ email: 'user3@a.com', password: 'pass3' });
    //console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token3= loginRes.body.token;
    userId3 = jwt.verify(token3, 'secretKey').id;
  });

  test('유저1 글 20개 작성', async () => {
    // coffee.json 파일 읽기
    const filePath = path.join(__dirname, '../recommendation-ai/coffee.json');
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (let i = 0; i < 20; i++) {
        const res = await request(app)
            .post('/post/me')
            .set('Authorization', `Bearer ${token1}`)
            .send({ 
                content: contents[i], 
                image: '' 
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
        expect(res.body.postId).toBeDefined();

        user1PostIds.push(res.body.postId);
    }
  });

  test('유저2 글 20개 작성', async () => {
    // whisky.json 파일 읽기
    const filePath = path.join(__dirname, '../recommendation-ai/whisky.json');
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (let i = 0; i < 20; i++) {
        const res = await request(app)
            .post('/post/me')
            .set('Authorization', `Bearer ${token2}`) // 유저2 토큰 사용
            .send({ 
                content: contents[i], 
                image: '' 
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
        expect(res.body.postId).toBeDefined();

        user2PostIds.push(res.body.postId);
    }
  });

  test('유저3에게 추천 게시글 반환 (랜덤 게시물)', async () => {

    // 추천 게시글 요청 (유저3은 게시글이 없으므로 랜덤 반환)
    const res = await request(app)
        .post('/ai-recommendation-post-post')
        .set('Authorization', `Bearer ${token3}`)
        .send(); // 추가 데이터 없이 전송

    // 응답 검증
    expect(res.status).toBe(200); // 요청 성공
    expect(res.body).toHaveProperty('posts'); // posts 속성 확인
    expect(res.body.posts.length).toBe(50); // 랜덤 50개 게시물 반환
    res.body.posts.forEach(post => {
        expect(post).toHaveProperty('_id'); // 게시물 ID 확인
        expect(post).toHaveProperty('content'); // 게시물 내용 확인
        expect(post).toHaveProperty('likeCount'); // likeCount 확인
        expect(post).toHaveProperty('weight'); // weight 확인
    });
  });

});