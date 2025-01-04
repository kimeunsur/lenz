const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');
const { getTestData } = require('./setupTests');

let server;

describe('프로필 업데이트 테스트', () => {
  let userId;
  let token;

  beforeAll(async () => {
    server = app.listen(4000);
    const testData = getTestData(); // setupTests에서 저장된 데이터 가져옴
    userId = testData.userId;
    token = testData.token;
  });

  afterAll(async () => {
    server.close();
    await mongoose.connection.close();
  });

  it('PUT /user/:id/name - 유저 이름 업데이트 성공', async () => {
    const newName = '새이름';
    const res = await request(app)
      .put(`/user/${userId}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: newName });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);

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

    const updatedUser = await User.findById(userId);
    expect(updatedUser.profileImage).toBe(newProfileImage);
  });
});