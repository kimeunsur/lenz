const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const connectDB = require('../src/config/db');
const jwt = require('jsonwebtoken');

describe('통합 테스트: 회원가입, 글 작성, 좋아요, 팔로우', () => {
  let token1, token2, postId, userId1, userId2;

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
  
  test('유저1이 글 작성 성공', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
            content: '유저1의 첫 번째 글입니다.', 
            image: '' 
        });

    //console.log('Expected output: 글 작성 성공, status=201');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');

    postId = res.body.postId;
    expect(postId).toBeDefined(); // postId가 정의되었는지 확인
    //console.log('postId:', postId);
  });
  
    test('유저 1이 유저1의 글 작성 수 확인', async () => {
      const res = await request(app)
          .get('/user/posts/count')
          .set('Authorization', `Bearer ${token1}`) // 유저1의 토큰 사용
          .send(); // userId는 전달하지 않음 (Authorization에서 추출)

      //console.log('Expected output: 글 작성 수 1개, status=200');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('postCount', 1); // 글 작성 수가 1개인지 확인
  });

  test('유저2가 유저1의 글 작성 수 확인', async () => {

    const res = await request(app)
        .get(`/user/posts/count?userId=${userId1}`) // 쿼리 파라미터로 userId 전달
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰 사용

    //console.log('Expected output: 유저1의 글 작성 수 1개, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('postCount', 1); // 유저1의 글 작성 수가 1개인지 확인
  });

  test('유저2가 유저1 팔로우 성공', async () => {

    const res = await request(app)
        .post(`/follow/${userId1}`) // userId1는 token2에서 추출
        .set('Authorization', `Bearer ${token2}`); // token1으로 유저1 인증

    //console.log('Expected output: 팔로우 성공, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });

  test('키워드로 유저 검색 - "user"로 검색 시 유저1과 유저2 반환', async () => {
    const res = await request(app)
      .get('/search?keyword=user&page=1')
      .set('Authorization', `Bearer ${token1}`); // 유저1 인증
  
    //console.log('Expected output: 유저1과 유저2 반환, status=200');
    expect(res.status).toBe(200); // 상태 코드 확인
    expect(res.body.users).toBeInstanceOf(Array); // 결과는 배열이어야 함
    expect(res.body.users.length).toBe(2); // 유저1, 유저2 두 명만 반환되어야 함
  
    // 유저1과 유저2의 이메일 및 이름 확인
    const userEmails = res.body.users.map(user => user.email);
    expect(userEmails).toContain('user1@a.com');
    expect(userEmails).toContain('user2@a.com');
  
    const userNames = res.body.users.map(user => user.name);
    expect(userNames).toContain(''); // 초기 이름은 빈 문자열일 것으로 예상
  });
  
  test('유저2가 팔로우한 유저의 게시물 확인', async () => {
    const res = await request(app)
        .get('/post/following')
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰 사용

    //console.log('Expected output: 팔로우한 유저의 게시물, status=200');
    expect(res.status).toBe(200);
    expect(res.body.posts).toBeDefined(); // 게시물 리스트가 정의되었는지 확인
    expect(res.body.posts.length).toBe(1); // 게시물이 1개인지 확인
});

  test('유저 1의 팔로워 목록에 유저2만 포함', async () => {

    // 유저1의 팔로워 목록 조회
    const res = await request(app)
        .get('/user/me/followers')
        .set('Authorization', `Bearer ${token1}`); // token1로 유저1 인증

    //console.log('Expected output: 유저2의 팔로워 목록에 유저1만 포함, status=200');
    expect(res.status).toBe(200);
    expect(res.body.followers).toHaveLength(1); // 팔로워 한 명만 있어야 함
    expect(res.body.followers[0]).toBe(userId2); // 유저2의 ID가 팔로워 목록에 있어야 함
});

test('유저 2의 팔로잉 목록에 유저1만 포함', async () => {
  // 유저2의 팔로잉 목록 조회
  const res = await request(app)
      .get('/user/me/following')
      .set('Authorization', `Bearer ${token2}`); // token2으로 유저2 인증
  //console.log('Expected output: 유저1의 팔로잉 목록에 유저1만 포함, status=200');
  expect(res.status).toBe(200);
  expect(res.body.following).toHaveLength(1); // 팔로잉 한 명만 있어야 함
  expect(res.body.following[0]).toBe(userId1); // 유저1의 ID가 팔로잉 목록에 있어야 함
});

  test('유저1의 팔로워 수가 1 증가했는지 확인', async () => {

    // 유저1의 팔로우 통계 조회
    const res = await request(app)
        .get('/user/me/follow-stats')
        .set('Authorization', `Bearer ${token1}`); // 유저1의 토큰으로 인증

    //console.log('Expected output: 팔로워 수 = 1, 팔로잉 수 = 0');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('followerCount', 1); // 유저1은 유저2에게 팔로우됨
    expect(res.body).toHaveProperty('followingCount', 0); // 유저1은 아무도 팔로우하지 않음
  });

  test('유저2의 팔로잉 수가 1 증가했는지 확인', async () => {
    // 유저2의 팔로우 통계 조회
    const res = await request(app)
        .get('/user/me/follow-stats')
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰으로 인증

    //console.log('Expected output: 팔로워 수 = 0, 팔로잉 수 = 1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('followerCount', 0); // 유저2는 아무에게도 팔로우되지 않음
    expect(res.body).toHaveProperty('followingCount', 1); // 유저2가 유저1을 팔로우
  });

  test('유저2가 유저1 언팔로우 성공', async () => {

    const res = await request(app)
        .delete(`/unfollow/${userId1}`) // userId1는 token1에서 추출
        .set('Authorization', `Bearer ${token2}`); // token2으로 유저2 인증

    //console.log('Expected output: 언팔로우 성공, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '언팔로우 성공!');
  });
});