const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');
const { saveTestData, clearTestData } = require('./setupTests');

let server;

describe('회원가입 및 로그인 테스트', () => {
  beforeAll(async () => {
    server = app.listen(4000);
  });

  afterAll(async () => {
    await mongoose.connection.db.collection('users').drop();
    server.close();
    await mongoose.connection.close();
    clearTestData();
  });

  it('POST /register - 회원가입 성공', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'testpass' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '회원가입 성공');

    const user = await User.findOne({ username: 'testuser' });
    expect(user).not.toBeNull();

    saveTestData({ userId: user._id.toString() });
  });

  it('POST /login - 로그인 성공', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    const testData = require('./testData.json');
    saveTestData({ ...testData, token: res.body.token });
  });
});