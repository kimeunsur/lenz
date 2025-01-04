// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
app.use(express.json()); // 요청 바디를 JSON으로 파싱

// CORS 설정
app.use(cors({
    origin: 'http://localhost:3001', // 허용할 프론트엔드 URL
    credentials: true, // 쿠키, 인증 정보를 허용하려면 true로 설정
}));



// DB 연결
connectDB();

// 라우터 설정
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/profile')); 
app.use('/', require('./routes/interaction'));
app.use('/', require('./routes/post'));

// app.js에서는 서버 실행하지 않고, 서버 객체만 내보냄
module.exports = app;