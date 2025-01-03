

const mongoose = require('mongoose');
require('dotenv/lib/main').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECT_DB); // 추가 옵션 제거
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
};

module.exports = connectDB;