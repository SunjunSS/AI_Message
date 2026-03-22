// convert_stats 테이블이 어떻게 생겼는지 JavaScript로 정의한 파일

const { DataTypes } = require('sequelize');
// MySQL DB에 접속하는 연결 정보를 가져옴
const sequelize = require('../config/localDB');

// 테이블 컬럼 정의
// 실제 DB의 convert_stats 테이블 컬럼을 JavaScript 객체로 표현
const ConvertStats = sequelize.define('ConvertStats', {
  // id 컬럼 - 이 테이블 각 row의 고유 번호, 자동 증가하는 기본 키
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // user_id 컬럼 - 필수값, 어떤 유저의 기록인지 연결, users 테이블의 id 참조
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // tone 컬럼 - 필수값, 사용한 톤 id 저장 (예: 'polite', 'professional')
  tone: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'convert_stats',  // 이 모델이 convert_stats 테이블과 매핑됨
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ConvertStats;