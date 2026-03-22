// users 테이블이 어떻게 생겼는지 JavaScript로 정의한 파일

const { DataTypes } = require('sequelize');
// MySQL DB에 접속하는 연결 정보를 가져옴
const sequelize = require('../config/localDB'); 

// 테이블 컬럼 정의
// 실제 DB의 users 테이블 컬럼을 JavaScript 객체로 표현
const User = sequelize.define('User', {
  // id 컬럼 - 자동 증가하는 기본 키
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // email 컬럼 - 필수값, 중복 불가
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  // name 컬럼 - 선택값
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'users',  // 이 모델이 users 테이블과 매핑됨
  timestamps: true,        
  createdAt: 'created_at',
  updatedAt: false,     
});

module.exports = User;