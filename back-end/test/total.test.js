// __tests__/integrated.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');
const Post = require('../src/models/Post'); // Post 모델

let server;
let db;

describe('통합 테스트', () => {
  let userId;
  let token;
  let postId;

  // 모든 테스트 시작 전 서버 구동
  beforeAll(async () => {
    server = app.listen(4000);
  });

  // 모든 테스트 종료 후 DB 정리 및 서버 종료
  afterAll(async () => {
    db = mongoose.connection.db;
    // 아래 방식은 테스트 용 DB를 통째로 삭제하므로
    // 필요에 따라 dropDatabase 대신 개별 컬렉션 drop으로 대체 가능
    await db.dropDatabase();
    server.close();
    await mongoose.connection.close();
  });

  describe('인증 관련 테스트', () => {
    it('POST /register - 회원가입 성공', async () => {
      const res = await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'testpass' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', '회원가입 성공');

      // 회원가입된 사용자 확인
      const user = await User.findOne({ username: 'testuser' });
      expect(user).not.toBeNull();
      userId = user._id.toString();
      console.log('회원가입된 유저 ID:', userId);
    });

    it('POST /login - 로그인 성공', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpass' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('PUT /user/:id/name - 유저 이름 업데이트 성공', async () => {
      const newName = '새이름';
      const res = await request(app)
        .put(`/user/${userId}/name`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(newName);

      // DB에서 이름 변경 확인
      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe(newName);
    });

    it('PUT /user/:id/profile-picture - 프로필 사진 업데이트 성공', async () => {
      const newProfileImage = 'https://img.insight.co.kr/static/2017/04/27/700/9J0PWXCECXB779VAK00I.jpg';
      const res = await request(app)
        .put(`/user/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${token}`)
        .send({ profileImage: newProfileImage });

      expect(res.status).toBe(200);
      expect(res.body.profileImage).toBe(newProfileImage);

      // DB에서 프로필 사진 변경 확인
      const updatedUser = await User.findById(userId);
      expect(updatedUser.profileImage).toBe(newProfileImage);
    });
  });

  describe('글 작성 및 좋아요 테스트', () => {
    it('POST /posts - 글 작성 성공', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '첫 번째 글입니다.' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', '글 작성 성공');

      postId = res.body.post._id;
      console.log('작성된 글 ID:', postId);
    });

    it('POST /posts/:id/like - 좋아요 성공', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', '좋아요 성공');
    });
  });
});