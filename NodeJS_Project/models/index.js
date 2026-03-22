const sequelize = require('../config/localDB');  // MySQL DB에 접속하는 연결 정보를 가져옴
const User = require('./users');  // User 모델 -> users 테이블
const ConvertStats = require('./convertStats'); // ConvertStats 모델 -> convert_stats 테이블

// User : ConvertStats = 1 : N 관계
// 유저 1명 → 변환 기록 여러개
User.hasMany(ConvertStats, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ConvertStats.belongsTo(User, { foreignKey: 'user_id' });

// DB 동기화 함수
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL 연결 성공');

    // 등록된 모델을 전부 동기화
    // false → 기존 테이블 유지
    // true → 기존 테이블 삭제 후 새로 생성
    await sequelize.sync({ force: false });
    console.log('✅ DB 동기화 완료');
  } catch (error) {
    console.error('❌ DB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  User,
  ConvertStats,
  initDB,
};