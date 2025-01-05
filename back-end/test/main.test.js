const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const connectDB = require('../src/config/db');
const jwt = require('jsonwebtoken');

describe('통합 테스트: 회원가입, 글 작성, 좋아요, 팔로우', () => {
  let token1, token2;
  let postId;

  beforeAll(async () => {
    console.log('테스트 DB 초기화');
    require('dotenv').config();
    process.env.NODE_ENV = 'test';
    await connectDB();
    const db = mongoose.connection.getClient().db('testDatabase');
    await db.dropDatabase();
  });

  afterAll(async () => {
    console.log('테스트 DB 삭제 및 연결 해제');
    const db = mongoose.connection.getClient().db('testDatabase'); // 다시 db 객체 가져오기
    await db.dropDatabase(); // DB 삭제
    await mongoose.connection.close(); // 연결 해제
  });

  test('유저1 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user1@a.com', password: 'pass1' });
    console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ email: 'user1@a.com', password: 'pass1' });
    console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token1 = loginRes.body.token;
  });

  test('유저2 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user2@a.com', password: 'pass2' });
    console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ email: 'user2@a.com', password: 'pass2' });
    console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token2 = loginRes.body.token;
  
  });
  
  test('유저1이 글 작성 성공', async () => {
    const res = await request(app)
        .post('/post')
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
            content: '유저1의 첫 번째 글입니다.', 
            image: '' 
        });

    console.log('Expected output: 글 작성 성공, status=201');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');

    postId = res.body.postId;
    expect(postId).toBeDefined(); // postId가 정의되었는지 확인
    console.log('postId:', postId);
  });

  test('유저2가 유저1의 글에 좋아요 성공', async () => {
    console.log('postId:', postId);
    console.log('token2:', token2);
    const res = await request(app)
      .post(`/post/${postId}/like`)
      .set('Authorization', `Bearer ${token2}`);

    console.log('Expected output: 좋아요 성공, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });

  test('유저1이 유저2 팔로우 성공', async () => {
    const decodedToken2 = jwt.verify(token2, 'secretKey');
    const userId2 = decodedToken2.id;

    const res = await request(app)
        .post(`/follow/${userId2}`) // userId2는 token2에서 추출
        .set('Authorization', `Bearer ${token1}`); // token1으로 유저1 인증

    console.log('Expected output: 팔로우 성공, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });

  test('유저1이 유저2 언팔로우 성공', async () => {
    // token2에서 userId2 추출
    const decodedToken2 = jwt.verify(token2, 'secretKey');
    const userId2 = decodedToken2.id;

    const res = await request(app)
        .delete(`/unfollow/${userId2}`) // userId2는 token2에서 추출
        .set('Authorization', `Bearer ${token1}`); // token1으로 유저1 인증

    console.log('Expected output: 언팔로우 성공, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '언팔로우 성공!');
  });
});