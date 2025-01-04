const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');

let server;

describe('팔로우 기능 테스트', () => {
  let userId1, userId2;
  let token1, token2;

  beforeAll(async () => {
    server = app.listen(4002);

    // 유저1 생성 및 로그인
    const user1Res = await request(app).post('/register').send({ username: 'user1', password: 'pass1' });
    expect(user1Res.status).toBe(201);
    const login1Res = await request(app).post('/login').send({ username: 'user1', password: 'pass1' });
    token1 = login1Res.body.token;
    userId1 = login1Res.body.userId;

    // 유저2 생성 및 로그인
    const user2Res = await request(app).post('/register').send({ username: 'user2', password: 'pass2' });
    expect(user2Res.status).toBe(201);
    const login2Res = await request(app).post('/login').send({ username: 'user2', password: 'pass2' });
    token2 = login2Res.body.token;
    userId2 = login2Res.body.userId;
  });

  afterAll(async () => {
    // 테스트 데이터 삭제 및 서버 종료
    await mongoose.connection.db.collection('users').drop();
    server.close();
    await mongoose.connection.close();
  });

  it('POST /follow/:id - 팔로우 성공', async () => {
    const res = await request(app)
      .post(`/follow/${userId2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공');
  });

  it('POST /unfollow/:id - 언팔로우 성공', async () => {
    const res = await request(app)
      .post(`/unfollow/${userId2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '언팔로우 성공');
  });
});