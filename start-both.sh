#!/bin/bash

# 프론트엔드 실행
cd front-end/lenz
npm start &          # 기본적으로 3000번 포트 사용
FRONTEND_PID=$!

# 3초 대기 (프론트엔드 서버 올라가는 시간)
sleep 3

# 백엔드 실행
cd ../../back-end
node src/index.js &  # 백엔드는 소스 코드에서 3001번 포트 같은 식으로 listen()하도록 작성

# 앞에서 백그라운드로 띄운 프론트엔드가 종료될 때까지 대기
wait $FRONTEND_PID