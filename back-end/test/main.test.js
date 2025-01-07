const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const connectDB = require('../src/config/db');
const jwt = require('jsonwebtoken');

describe('통합 테스트: 회원가입, 글 작성, 좋아요, 팔로우', () => {
  let token1, token2, token3, token4, postId1, postId2, postId3, postId4, postId5, userId1, userId2, userId3, userId4;

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

  test('유저3 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user3@a.com', password: 'pass3' });
    // console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);
  
    const loginRes = await request(app).post('/login').send({ email: 'user3@a.com', password: 'pass3' });
    // console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token3 = loginRes.body.token;
    userId3 = jwt.verify(token3, 'secretKey').id;
  });

  test('유저4 회원가입 및 로그인', async () => {
    const userRes = await request(app).post('/register').send({ email: 'user4@a.com', password: 'pass4' });
    // console.log('Expected output: 회원가입 성공, status=201');
    expect(userRes.status).toBe(201);
  
    const loginRes = await request(app).post('/login').send({ email: 'user4@a.com', password: 'pass4' });
    // console.log('Expected output: 로그인 성공, status=200');
    expect(loginRes.status).toBe(200);
    token4 = loginRes.body.token;
    userId4 = jwt.verify(token4, 'secretKey').id;
  });
  
  test('post1(작성자: user1)', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
            content: '유저1의 첫 번째 글입니다.', 
            image: '' 
        });
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
  
    postId1 = res.body.postId;
    expect(postId1).toBeDefined();
  });
  
  test('post2(작성자: user1)', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
            content: '유저1의 두 번째 글입니다.', 
            image: '' 
        });
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
  
    postId2 = res.body.postId;
    expect(postId2).toBeDefined();
  });
  
  test('post3(작성자: user2)', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token2}`)
        .send({ 
            content: '유저2의 첫 번째 글입니다.', 
            image: '' 
        });
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
  
    postId3 = res.body.postId;
    expect(postId3).toBeDefined();
  });
  
  test('post4(작성자: user3)', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token3}`)
        .send({ 
            content: '유저3의 첫 번째 글입니다.', 
            image: '' 
        });
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
  
    postId4 = res.body.postId;
    expect(postId4).toBeDefined();
  });
  
  test('post5(작성자: user4)', async () => {
    const res = await request(app)
        .post('/post/me')
        .set('Authorization', `Bearer ${token4}`)
        .send({ 
            content: '유저4의 첫 번째 글입니다.', 
            image: '' 
        });
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', '글이 성공적으로 작성되었습니다.');
  
    postId5 = res.body.postId;
    expect(postId5).toBeDefined();
  });
  
    test('유저 1이 유저1의 글 작성 수 확인, 2개', async () => {
      const res = await request(app)
          .get('/user/posts/count')
          .set('Authorization', `Bearer ${token1}`) // 유저1의 토큰 사용
          .send(); // userId는 전달하지 않음 (Authorization에서 추출)

      //console.log('Expected output: 글 작성 수 1개, status=200');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('postCount', 2); // 글 작성 수가 2개인지 확인
  });

  test('유저2가 유저1의 글 작성 수 확인, 2개', async () => {

    const res = await request(app)
        .get(`/user/posts/count?userId=${userId1}`) // 쿼리 파라미터로 userId 전달
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰 사용

    //console.log('Expected output: 유저1의 글 작성 수 1개, status=200');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('postCount', 2); // 유저1의 글 작성 수가 2개인지 확인
  });

  test('user2가 user1 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId1}`) // userId1는 token1에서 추출
        .set('Authorization', `Bearer ${token2}`); // token2로 user2 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });
  
  test('user3가 user1 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId1}`)
        .set('Authorization', `Bearer ${token3}`); // token3으로 user3 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });
  
  test('user4가 user1 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId1}`)
        .set('Authorization', `Bearer ${token4}`); // token4로 user4 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });
  
  test('user2가 user3 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId3}`) // userId3는 token3에서 추출
        .set('Authorization', `Bearer ${token2}`); // token2로 user2 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });
  
  test('user3가 user2 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId2}`) // userId2는 token2에서 추출
        .set('Authorization', `Bearer ${token3}`); // token3으로 user3 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });
  
  test('user4가 user3 팔로우 성공', async () => {
    const res = await request(app)
        .post(`/follow/${userId3}`)
        .set('Authorization', `Bearer ${token4}`); // token4로 user4 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '팔로우 성공!');
  });

  test('user2가 post1(user1 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId1}/like`) // postId1은 user1의 post1 ID
        .set('Authorization', `Bearer ${token2}`); // token2로 user2 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user3가 post1(user1 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId1}/like`)
        .set('Authorization', `Bearer ${token3}`); // token3으로 user3 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user3가 post2(user1 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId2}/like`) // postId2는 user1의 post2 ID
        .set('Authorization', `Bearer ${token3}`); // token3으로 user3 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user4가 post2(user1 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId2}/like`)
        .set('Authorization', `Bearer ${token4}`); // token4로 user4 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user1가 post3(user2 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId3}/like`) // postId3은 user2의 post3 ID
        .set('Authorization', `Bearer ${token1}`); // token1으로 user1 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user4가 post4(user3 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId4}/like`) // postId4는 user3의 post4 ID
        .set('Authorization', `Bearer ${token4}`); // token4로 user4 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user1가 post5(user4 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId5}/like`) // postId5는 user4의 post5 ID
        .set('Authorization', `Bearer ${token1}`); // token1으로 user1 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user2가 post5(user4 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId5}/like`)
        .set('Authorization', `Bearer ${token2}`); // token2로 user2 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });
  
  test('user3가 post5(user4 작성)에 좋아요 추가 성공', async () => {
    const res = await request(app)
        .post(`/post/${postId5}/like`)
        .set('Authorization', `Bearer ${token3}`); // token3으로 user3 인증
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '좋아요가 추가되었습니다.');
  });

  test('유저2가 /post/sort-by-like 호출 시 정렬 확인', async () => {
    const res = await request(app)
        .get('/post/sort-by-like')
        .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);

    const posts = res.body.posts;
    // posts.forEach(post => {
    //   console.log(` like - Post ID: ${post._id}, Recommendation Score: ${post.recommendationScore}`);
    // });
    expect(posts.length).toBeGreaterThanOrEqual(5);

    expect(posts[0]._id).toBe(postId5); // 포스트 5
    expect(posts[1]._id).toBe(postId1); // 포스트 1
    expect(posts[2]._id).toBe(postId2); // 포스트 2
    expect(posts[3]._id).toBe(postId3); // 포스트 3
    expect(posts[4]._id).toBe(postId4); // 포스트 4
});
test('유저2가 /post/sort-by-followers 호출 시 정렬 확인', async () => {
  const res = await request(app)
      .get('/post/sort-by-followers')
      .set('Authorization', `Bearer ${token2}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.posts)).toBe(true);

  const posts = res.body.posts;

  // // 포스트 ID를 번호로 변환
  // const postIds = posts.map(post => {
  //     if (post._id === postId1) return '1';
  //     if (post._id === postId2) return '2';
  //     if (post._id === postId3) return '3';
  //     if (post._id === postId4) return '4';
  //     if (post._id === postId5) return '5';
  //     return 'unknown'; // 알 수 없는 ID일 경우 
  // });

  // console.log(postIds); // 변환된 번호 배열 출력

  // posts.forEach(post => {
  //     console.log(`followers - Post ID: ${post._id}, Recommendation Score: ${post.recommendationScore}`);
  // });
  expect(posts.length).toBeGreaterThanOrEqual(5);

  expect(posts[0]._id).toBe(postId2); // 포스트 1
  expect(posts[0].recommendationScore).toBeGreaterThan(posts[1].recommendationScore);
  
  expect(posts[1]._id).toBe(postId1); // 포스트 2
  expect(posts[1].recommendationScore).toBeGreaterThan(posts[2].recommendationScore);
  
  expect(posts[2]._id).toBe(postId4); // 포스트 4
  expect(posts[2].recommendationScore).toBeGreaterThan(posts[3].recommendationScore);
  
  expect(posts[3]._id).toBe(postId3); // 포스트 3
  expect(posts[3].recommendationScore).toBeGreaterThan(posts[4].recommendationScore);
  
  expect(posts[4]._id).toBe(postId5); // 포스트 5
});

test('유저2가 /post/sort-by-coFollower 호출 시 정렬 확인', async () => {
  const res = await request(app)
      .get('/post/sort-by-coFollower')
      .set('Authorization', `Bearer ${token2}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.posts)).toBe(true);

  const posts = res.body.posts;
//   const postIds = posts.map(post => {
//     if (post._id === postId1) return '1';
//     if (post._id === postId2) return '2';
//     if (post._id === postId3) return '3';
//     if (post._id === postId4) return '4';
//     if (post._id === postId5) return '5';
//     return 'unknown'; // 알 수 없는 ID일 경우
// });

// console.log(postIds);
    // posts.forEach(post => {
    //   console.log(`coFollower Post ID: ${post._id}, Recommendation Score: ${post.recommendationScore}`);
    // });
    expect(posts.length).toBe(0);
  });
test('유저2가 /post/sort-by-coLiker 호출 시 정렬 확인', async () => {
  const res = await request(app)
      .get('/post/sort-by-coLiker')
      .set('Authorization', `Bearer ${token2}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.posts)).toBe(true);

  const posts = res.body.posts;
//   const postIds = posts.map(post => {
//     if (post._id === postId1) return '1';
//     if (post._id === postId2) return '2';
//     if (post._id === postId3) return '3';
//     if (post._id === postId4) return '4';
//     if (post._id === postId5) return '5';
//     return 'unknown'; // 알 수 없는 ID일 경우
// });

// console.log("지금뜬거:"+postIds);
  // posts.forEach(post => {
  //   console.log(` coLiker Post ID: ${post._id}, Recommendation Score: ${post.recommendationScore}`);
  // });
expect(posts.length).toBe(1);

expect(posts[0]._id).toBe(postId2); // 포스트 2
});
test('유저2가 /post/recommendations 호출 시 정렬 확인', async () => {
  const res = await request(app)
      .get('/post/recommendations')
      .set('Authorization', `Bearer ${token2}`); // 유저2의 인증 토큰 사용

  // 1. 상태 코드 확인
  expect(res.status).toBe(200);

  // 2. posts 배열 확인
  expect(Array.isArray(res.body.posts)).toBe(true);

  const posts = res.body.posts;

  // 3. posts 배열 출력
  // posts.forEach(post => {
  //     console.log(`Recommendation - Post ID: ${post.postId}, Score: ${post.recommendationScore}`);
  // });

  // 4. 최소 5개의 포스트가 반환되었는지 확인
  expect(posts.length).toBe(5);

  // 5. 포스트 정렬 확인 (예상 순서: 2, 1, 5, 3, 4)
  expect(posts[0].postId).toBe(postId2); // 포스트 2
  expect(posts[1].postId).toBe(postId1); // 포스트 1
  expect(posts[2].postId).toBe(postId5); // 포스트 5
  expect(posts[3].postId).toBe(postId3); // 포스트 3
  expect(posts[4].postId).toBe(postId4); // 포스트 4

  // 6. 점수가 내림차순으로 정렬되었는지 확인
  for (let i = 0; i < posts.length - 1; i++) {
      expect(posts[i].recommendationScore).toBeGreaterThanOrEqual(posts[i + 1].recommendationScore
      );
  }
});

  test('유저2가 팔로우한 유저의 게시물 확인', async () => {
    const res = await request(app)
        .get('/post/following')
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰 사용

    //console.log('Expected output: 팔로우한 유저의 게시물, status=200');
    expect(res.status).toBe(200);
    expect(res.body.posts).toBeDefined(); // 게시물 리스트가 정의되었는지 확인
    expect(res.body.posts.length).toBe(3); // 게시물이 3개인지 확인
});

  test('유저 3의 팔로우 목록에 유저2만 포함', async () => {

    // 유저1의 팔로워 목록 조회
    const res = await request(app)
        .get('/user/me/following')
        .set('Authorization', `Bearer ${token3}`); 

    //console.log('Expected output: 유저2의 팔로워 목록에 유저1만 포함, status=200');
    //console.log(res.body.following);
    expect(res.status).toBe(200);
    expect(res.body.following).toHaveLength(2); // 팔로워 한 명만 있어야 함
    expect(res.body.following[0]).toBe(userId2); // 유저2의 ID가 팔로워 목록에 있어야 함
});

  test('유저1의 팔로워 수가 3 증가했는지 확인', async () => {

    // 유저1의 팔로우 통계 조회
    const res = await request(app)
        .get('/user/me/follow-stats')
        .set('Authorization', `Bearer ${token1}`); // 유저1의 토큰으로 인증

    //console.log('Expected output: 팔로워 수 = 1, 팔로잉 수 = 0');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('followerCount', 3);  // 유저1을 팔로우한 유저가 3명
    expect(res.body).toHaveProperty('followingCount', 0); // 유저1은 아무도 팔로우하지 않음
  });

  test('유저2의 팔로잉 수가 1 증가했는지 확인', async () => {
    // 유저2의 팔로우 통계 조회
    const res = await request(app)
        .get('/user/me/follow-stats')
        .set('Authorization', `Bearer ${token2}`); // 유저2의 토큰으로 인증

    //console.log('Expected output: 팔로워 수 = 0, 팔로잉 수 = 1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('followerCount', 1); // 유저2를 팔로우한 유저가 1명
    expect(res.body).toHaveProperty('followingCount', 2);  // 유저2가 팔로우한 유저가 2명
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