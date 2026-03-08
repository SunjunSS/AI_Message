const express = require('express');
const cors = require('cors');
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 테스트 엔드포인트
app.get('/', (req, res) => {
  res.json({ message: '서버가 정상 작동 중입니다!' });
});

// 톤 변환 API - Colab 서버로 연결
app.post('/api/tone-convert', async (req, res) => {
  try {
    const { message, tone, is_subject, context } = req.body;  // ⭐ is_subject와 context 추가
    
    const messageType = is_subject ? '📧 제목' : '📝 본문';  // ⭐ 프론트에서 받은 값 사용

    console.log('\n====================================');
    console.log(`📨 ${messageType} 변환 요청 받음`);
    if (is_subject) {
      console.log('제목:', message);
    } else {
      console.log('본문:', message);
    }
    console.log('톤:', tone);
    console.log('====================================');

    // Colab Flask 서버로 요청
    console.log(`🔄 Colab 서버로 ${messageType} 전송 중...`);
    const colabResponse = await fetch('https://tone-converter.loca.lt/tone-convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        tone: tone,
        is_subject: is_subject,  // 프론트에서 받은 값 전달
        context: context  // context 전달
      })
    });

    if (!colabResponse.ok) {
      throw new Error(`Colab 서버 응답 실패: ${colabResponse.status}`);
    }

    const colabData = await colabResponse.json();

    // 📝 본문일 때만 줄바꿈 추가
    if (!is_subject) {
      let formattedMessage = colabData.converted
        .replace(/\. /g, '.\n\n')      // 마침표 뒤
        .replace(/\? /g, '?\n\n')      // 물음표 뒤
        .replace(/\! /g, '!\n\n')    // 느낌표 뒤
        .replace(/,\s/g, ',\n');       // 쉼표 뒤

      // 응답 데이터 수정
      colabData.converted = formattedMessage;
    }

    console.log(`✅ Colab 서버로부터 받은 ${messageType} 변환 결과:`);
    console.log('원본:', colabData.original);
    console.log('변환:', colabData.converted);
    console.log('====================================');

    // 프론트엔드로 Colab 응답 그대로 전달
    res.json(colabData);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    res.status(500).json({
      error: 'AI 변환 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.\n`);
});