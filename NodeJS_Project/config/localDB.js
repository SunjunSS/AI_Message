const { Sequelize } = require('sequelize');  // Sequelize 라이브러리에서 Sequelize 클래스 가져오기
const dotenv = require('dotenv');  // .env 파일 읽기 위한 dotenv 라이브러리 가져오기
const path = require('path');  // 경로 처리를 위한 path 모듈 가져오기

// .env 파일에서 DB 접속 정보를 환경변수로 불러옴
dotenv.config({ path: path.join(__dirname, '../.env') });

// MySQL DB에 접속하는 연결 정보를 설정
const sequelize = new Sequelize(
  process.env.DB_NAME,      // DB 이름: ai_message
  process.env.DB_USER,      // DB 유저: root
  process.env.DB_PASSWORD,  // DB 비밀번호
  {
    host: process.env.DB_HOST,  // DB 주소: localhost
    dialect: 'mysql',  // MySQL 사용
    port: process.env.DB_PORT || 3306,  // DB 포트: 3306 (기본값)
    timezone: '+09:00',  // 한국 시간대
    logging: false,      // SQL 로그 끄기
  }
);

module.exports = sequelize;