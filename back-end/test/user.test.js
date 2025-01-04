const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');
let server;
let db;
describe('인증 관련 테스트', () => {

  let userId;
  let token;
  
  // 모든 테스트 시작 전
  beforeAll(async () => {
    server = app.listen(4000);
    
  });

  // 모든 테스트 끝난 뒤
  afterAll(async () => {
    // 테스트가 끝난 후 DB 연결 종료
    db = mongoose.connection.db; 
    await db.collection('users').drop();
    server.close();
    await mongoose.connection.close();
  });

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
    console.log(userId);
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