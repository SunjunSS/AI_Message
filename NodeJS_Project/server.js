// server.js
const express = require('express');
const cors = require('cors');
const { initDB } = require('./models');

const app = express();

// 미들웨어 설정
// CORS 허용: 외부(프론트엔드) 요청을 받아들일 수 있게 해줌
app.use(cors());
// POST 요청의 body를 JSON으로 자동 파싱하여 req.body에 할당
app.use(express.json());

// 테스트 엔드포인트
app.get('/', (req, res) => {
  res.json({ message: '서버가 정상 작동 중입니다!' });
});

// 라우터 연결
app.use('/api', require('./routes/aiRoutes'));          // 감정 분석 + 톤 변환
app.use('/api/stats', require('./routes/statsRoutes')); // 통계 (MySQL)

const PORT = 3000;

// DB 연결 후 서버 시작
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.\n`);
  });
});