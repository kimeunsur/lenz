const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app'); // Express 앱
const User = require('../src/models/User');
const testDataPath = path.join(__dirname, 'testData.json');

function saveTestData(data) {
  fs.writeFileSync(testDataPath, JSON.stringify(data, null, 2));
}

function getTestData() {
  return JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
}

function clearTestData() {
  fs.writeFileSync(testDataPath, JSON.stringify({}, null, 2));
}
async function createUser(username, password) {
    // 회원가입 요청
    const registerRes = await request(app)
      .post('/register')
      .send({ username, password });
  
    if (registerRes.status !== 201) {
      throw new Error(`회원가입 실패: ${registerRes.body.message}`);
    }
  
    // 로그인 요청
    const loginRes = await request(app)
      .post('/login')
      .send({ username, password });
  
    if (loginRes.status !== 200) {
      throw new Error(`로그인 실패: ${loginRes.body.message}`);
    }
  
    return {
      userId: registerRes.body.userId,
      token: loginRes.body.token,
    };
  }

module.exports = { saveTestData, getTestData, clearTestData, createUser};