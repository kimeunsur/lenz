const request = require('supertest');
const app = require('../src/app'); // app.js 경로를 정확히 설정
const mongoose = require('mongoose');
const User = require('../src/models/User');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
// 테스트 DB 연결
beforeAll(async () => {
    console.log('CONNECT_DB:', process.env.CONNECT_DB);
    await mongoose.connect(process.env.CONNECT_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// 테스트 종료 후 DB 정리
afterAll(async () => {
    if (process.env.CONNECT_DB.includes('testDatabase')) {
        await mongoose.connection.dropDatabase(); // 테스트용 DB만 삭제
    }
    await mongoose.connection.close();
});
describe('User API', () => {
    let token;
    let userId;

    // 회원가입 테스트
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'password123',
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('회원가입 성공');
    });

    // 로그인 테스트
    it('should login the user and return a token', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'password123',
            });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        token = response.body.token;

        // 로그인한 유저의 ID 가져오기
        const decoded = jwt.verify(token, 'secretKey');
        userId = decoded.id;
    });

    // 이름 업데이트 테스트
    it('should update the user name', async () => {
        const response = await request(app)
            .put(`/user/${userId}/name`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Name',
            });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Updated Name');
    });

    // 프로필 사진 업데이트 테스트
    it('should update the user profile picture', async () => {
        const response = await request(app)
            .put(`/user/${userId}/profile-picture`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                profilePicture: 'https://example.com/profile.jpg',
            });

        expect(response.status).toBe(200);
        expect(response.body.profilePicture).toBe('https://example.com/profile.jpg');
    });

    // 잘못된 요청 - 이름을 제공하지 않은 경우
    it('should return error if name is not provided for update', async () => {
        const response = await request(app)
            .put(`/user/${userId}/name`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Name is required');
    });

    // 잘못된 요청 - 프로필 사진을 제공하지 않은 경우
    it('should return error if profile picture is not provided for update', async () => {
        const response = await request(app)
            .put(`/user/${userId}/profile-picture`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Profile picture is required');
    });

    // 잘못된 사용자 ID로 이름 업데이트 시도
    it('should return error if user not found for name update', async () => {
        const invalidUserId = mongoose.Types.ObjectId(); // 유효하지 않은 ID
        const response = await request(app)
            .put(`/user/${invalidUserId}/name`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Non Existent User',
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
    });
});