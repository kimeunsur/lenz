// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const app = express();
const {feedScheduler} = require('./jobs/feedScheduler'); // 스케줄러 불러오기

app.use(express.json()); // 요청 바디를 JSON으로 파싱
app.use(express.json({ limit: '10mb' })); // JSON 요청 본문 크기를 10MB로 설정
app.use(express.urlencoded({ limit: '10mb', extended: true })); // URL 인코딩된 데이터도 동일한 크기 설정

const path = require('path');

// DB 연결
connectDB();
console.log('feedScheduler 호출됨?');
feedScheduler();
console.log('feedScheduler 호출됨!');



// 라우터 설정
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/profile')); 
app.use('/', require('./routes/interaction'));
app.use('/', require('./routes/post'));
app.use('/', require('./routes/search'));
//app.use('/', require('./routes/ai-recommendation'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//app.use('/api', profileRouter); 

// app.js에서는 서버 실행하지 않고, 서버 객체만 내보냄
module.exports = app;