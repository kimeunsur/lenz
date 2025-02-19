const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.NODE_ENV === 'test' ? process.env.CONNECT_DB_TEST : process.env.CONNECT_DB;

const connectDB = async () => {
  try {
    //console.log('연결할 DB URI:', dbURI);
    await mongoose.connect(dbURI);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
};

module.exports = connectDB;