// src/index.js
const app = require('./app'); // app.js에서 설정된 Express 앱을 불러옴



const PORT = 3000; // 포트 번호를 3000으로 설정
app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});