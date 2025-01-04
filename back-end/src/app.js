// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
app.use(express.json()); // 요청 바디를 JSON으로 파싱

// DB 연결
connectDB();

// 라우터 설정
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/profile')); 
app.use('/', require('./routes/interaction'));
app.use('/', require('./routes/post'));
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.js에서는 서버 실행하지 않고, 서버 객체만 내보냄
module.exports = app;