const express = require('express');
const router = express.Router();

// 감정 분석 + 톤 추천 API 엔드포인트
// 프론트엔드의 요청을 받아 Colab 서버(Flask)로 중계
router.post('/analyze', async (req, res) => {  // ← app.post → router.post, '/api/analyze' → '/analyze'
  try {
    const { message } = req.body;  // 프론트엔드에서 받은 메시지

    console.log('\n====================================');
    console.log('🧠 감정 분석 + 톤 추천 요청 받음');
    console.log('메시지:', message);
    console.log('====================================');

    // Colab 서버(Flask)로 중계
    // Colab 서버 감정 분석 + 톤 추천 엔드포인트: /analyze
    console.log('🔄 Colab 서버로 감정 분석 + 톤 추천 요청 전송 중...');
    const colabResponse = await fetch('https://tone-converter.loca.lt/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!colabResponse.ok) {
      throw new Error(`Colab 서버 응답 실패: ${colabResponse.status}`);
    }

    // Colab 응답 데이터 파싱
    // { emotion_analysis: [ ... ], recommended_tones: ["professional", "polite"] } 형태로 받아옴
    const colabData = await colabResponse.json();

    console.log('✅ 감정 분석 + 톤 추천 결과:');
    console.log('추천 톤:', colabData.recommended_tones);
    console.log('====================================');

    // 프론트엔드로 Colab 응답 전달
    res.json(colabData);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    res.status(500).json({
      error: '감정 분석 + 톤 추천 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 톤 변환 API 엔드포인트
// 프론트엔드의 톤 변환 요청을 받아 Colab 서버(Flask)로 중계
router.post('/tone-convert', async (req, res) => {  // ← app.post → router.post, '/api/tone-convert' → '/tone-convert'
  try {
    const { message, tone, is_subject, context } = req.body;  // 프론트엔드에서 받은 데이터 구조분해 할당

    const messageType = is_subject ? '📧 제목' : '📝 본문';  // true: 제목, false: 본문

    console.log('\n====================================');
    console.log(`📨 ${messageType} 변환 요청 받음`);
    if (is_subject) {
      console.log('제목:', message);
    } else {
      console.log('본문:', message);
    }
    console.log('톤:', tone);
    console.log('====================================');

    // Colab 서버(Flask)로 중계
    // Colab 서버 톤 변환 엔드포인트: /tone-convert
    console.log(`🔄 Colab 서버로 ${messageType} 전송 중...`);
    const colabResponse = await fetch('https://tone-converter.loca.lt/tone-convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Colab 서버에 프론트엔드에서 받은 데이터를 전달 (POST)
      // context는 제목 변환인 경우에만 전달, 본문 변환인 경우 undefined로 처리
      body: JSON.stringify({
        message: message,
        tone: tone,
        is_subject: is_subject,
        context: is_subject ? context : undefined
      })
    });

    if (!colabResponse.ok) {
      throw new Error(`Colab 서버 응답 실패: ${colabResponse.status}`);
    }

    // Colab 응답 데이터 파싱
    const colabData = await colabResponse.json();

    // 📝 본문일 때만 줄바꿈 추가
    if (!is_subject) {
      let formattedMessage = colabData.converted
        .replace(/\. /g, '.\n\n')      // 마침표 뒤
        .replace(/\? /g, '?\n\n')      // 물음표 뒤
        .replace(/\! /g, '!\n\n')      // 느낌표 뒤
        .replace(/,\s/g, ',\n');       // 쉼표 뒤

      // 응답 데이터 수정: 프론트에서 바로 사용 가능하게 덮어쓰기
      colabData.converted = formattedMessage;
    }

    console.log(`✅ Colab 서버로부터 받은 ${messageType} 변환 결과:`);
    console.log('원본:', colabData.original);
    console.log('변환:', colabData.converted);
    console.log('====================================');

    // 프론트엔드로 Colab 응답 전달
    res.json(colabData);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    res.status(500).json({
      error: 'AI 변환 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

module.exports = router;