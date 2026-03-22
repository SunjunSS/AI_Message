const express = require('express');
const router = express.Router();
// DB 모델 불러오기
// User 모델 → users 테이블
// ConvertStats 모델 → convert_stats 테이블
const { User, ConvertStats } = require('../models');
// DB 집계 함수 불러오기
// SQL을 직접 쓰는 대신 JavaScript 함수로 표현
const { Op, fn, col, literal } = require('sequelize');

// 통계 저장 API 엔드포인트
// 프론트엔드의 요청을 받아 MySQL에 유저 및 톤 사용 기록 저장
router.post('/save', async (req, res) => {
  try {
    const { email, name, tone } = req.body;  // 프론트엔드에서 받은 데이터 구조분해 할당

    // users 테이블에서 유저 조회 or 생성 (없으면 자동 생성)
    const [user] = await User.findOrCreate({
      where: { email },   // email로 유저 조회
      defaults: { name }  // 유저가 없으면 name으로 새로 생성
    });

    // convert_stats 테이블에 톤 사용 기록 저장
    await ConvertStats.create({
      user_id: user.id,  // user_id 컬럼 — users 테이블의 id 참조
      tone  // tone 컬럼 — 사용한 톤 id 저장 (예: 'polite', 'professional')
    });

    console.log(`✅ 통계 저장 완료 - 유저: ${email}, 톤: ${tone}`);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ 통계 저장 실패:', error.message);
    res.status(500).json({ error: '통계 저장 실패', details: error.message });
  }
});

// 통계 조회 API 엔드포인트
// 프론트엔드의 요청을 받아 MySQL에서 total, todayCount, toneStats 조회 후 응답
// GET /api/stats?email=xxx
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;  // 프론트엔드에서 받은 이메일

    // users 테이블에서 email로 유저 조회
    const user = await User.findOne({ where: { email } });
    // 유저가 없으면 빈 통계 반환하고 종료
    if (!user) return res.json({ total: 0, todayCount: 0, toneStats: [] });

    // convert_stats 테이블에서 해당 유저의 총 변환 횟수 조회
    // SELECT COUNT(*) FROM convert_stats WHERE user_id = ?
    const total = await ConvertStats.count({
      where: { user_id: user.id }
    });

    // convert_stats 테이블에서 해당 유저의 오늘 변환 횟수 조회
    // 오늘 날짜의 00:00:00부터 현재까지의 기록을 조회
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 00:00:00로 설정

    const todayCount = await ConvertStats.count({
      where: {
        user_id: user.id,
        created_at: { [Op.gte]: today }
      }
    });

    // convert_stats 테이블에서 해당 유저의 톤별 사용 횟수 조회 (많이 쓴 순 정렬)
    const toneStats = await ConvertStats.findAll({
      attributes: [
        'tone',  // tone 컬럼 선택
        [fn('COUNT', col('tone')), 'count'] // COUNT(tone) AS count
      ],
      where: { user_id: user.id },  // 해당 유저의 기록만 조회
      group: ['tone'],  // tone별로 그룹화
      order: [[literal('count'), 'DESC']]  // 사용 횟수 많은 순으로 정렬
    });

    console.log(`✅ 통계 조회 완료 - 유저: ${email}`);
    // 프론트에 total, todayCount, toneStats JSON 응답
    res.json({
      total,  // 총 변환 횟수
      todayCount,  // 오늘 변환 횟수
      // toneStats 배열을 { tone, count } 형태로 변환
      // Sequelize COUNT 결과는 문자열로 반환 → parseInt로 숫자 변환 후 전달
      toneStats: toneStats.map(t => ({
        tone: t.tone,
        count: parseInt(t.dataValues.count)
      }))
    });

  } catch (error) {
    console.error('❌ 통계 조회 실패:', error.message);
    res.status(500).json({ error: '통계 조회 실패', details: error.message });
  }
});

module.exports = router;