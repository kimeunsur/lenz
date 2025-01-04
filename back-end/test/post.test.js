const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const Post = require('../src/models/Post'); // Post 모델
const User = require('../src/models/User');

let server;

describe('글 작성 및 좋아요 테스트', () => {
  let userId;
  let token;
  let postId;

  beforeAll(async () => {
    server = app.listen(4001);

    // 테스트 유저 생성 및 로그인
    const userRes = await request(app).post('/register').send({ username: 'testuser', password: 'testpass' });
    expect(userRes.status).toBe(201);

    const loginRes = await request(app).post('/login').send({ username: 'testuser', password: 'testpass' });
    token = loginRes.body.token;
    userId = loginRes.body.userId;
  });

  afterAll(async () => {
    // 테스트 데이터 삭제 및 서버 종료
    await mongoose.connection.db.collection('posts').drop();
    await mongoose.connection.db.collection('users').drop();
    server.close();
    await mongoose.connection.close();
  });

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