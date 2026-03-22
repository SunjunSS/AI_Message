# 📧 AI Message
톤앤매너를 선택하면 AI가 격식체 이메일로 변환해주는 작성 도우미

![Image](https://github.com/user-attachments/assets/f7023e13-0ebb-42a0-9f69-30f82b31a2ca)

<br>

## 📚 목차
- [🎯 프로젝트 개요](#-프로젝트-개요)
- [✨ 주요 기능](#-주요-기능)
- [🛠 기술 스택](#-기술-스택)
- [📸 Demo](#-demo)
- [🚀 실행 방법](#-실행-방법)

<br>

## 🎯 프로젝트 개요
AI Message는 구어체나 반말로 작성한 내용을 원하는 톤앤매너의 격식체 이메일로 자동 변환해주는 웹 서비스입니다.

🔐 Gmail 계정 연동 → ✍️ 편하게 내용 작성 → 🎨 톤앤매너 선택 → 🤖 AI 변환 → 📨 이메일 전송

<br>

## ✨ 주요 기능

- 🔐 Google OAuth 로그인 및 Gmail 발송 권한 연동
- 🎨 5가지 톤 선택 (정중한 / 전문적인 / 설득적인 / 공손한 / 협조적인)
- 🤖 AI 기반 이메일 톤앤매너 자동 변환
- ✏️ 변환된 제목 및 본문 수정 기능
- 📊 DB 기반 사용 통계 대시보드
- 🕘 변환 히스토리 저장 및 이전 결과 바로 불러오기
- 📨 실제 이메일 전송

<br>

## 🛠 기술 스택

**Frontend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-9466FF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

**Database**

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

**AI 서버**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Google Colab](https://img.shields.io/badge/Google_Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
> 감정 분석 모델 학습에 [AI-Hub](https://www.aihub.or.kr) 데이터셋을 활용하였습니다.

**기타**

![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Gmail SMTP](https://img.shields.io/badge/Gmail_SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)

<br>

## 📸 Demo

### 1. 랜딩 페이지
서비스 소개를 5개 섹션으로 구성한 랜딩 페이지입니다.  
스크롤을 내리면 각 섹션이 순서대로 나타납니다

<img width="1000" alt="메인1" src="https://github.com/user-attachments/assets/2b5bebfc-f9be-473c-a8a5-0077e85b6043" />
<img width="1000" alt="메인2" src="https://github.com/user-attachments/assets/a0191a10-e2f7-4fb5-9d29-4f417920795f" />
<img width="1000" alt="메인3" src="https://github.com/user-attachments/assets/21b2858b-4eeb-43ac-ac50-100f5938be71" />
<img width="1000" alt="메인4-1" src="https://github.com/user-attachments/assets/370080bd-d776-4dbe-897f-65e3d937dcd0" />
<img width="1000" alt="메인4-2" src="https://github.com/user-attachments/assets/2dab2e14-dfbd-458e-b3ba-42af57be5a7e" />
<img width="1000" alt="메인5" src="https://github.com/user-attachments/assets/d126414d-f65a-4b83-900c-5b8bbebd1218" />

### 2. 로그인
Google OAuth를 통해 로그인하면 Gmail 발송 권한이 자동으로 연동됩니다.

<img width="1000" alt="로그인1" src="https://github.com/user-attachments/assets/9d697f8e-71bd-416d-bbb0-c0f0e13b4de5" />
<img width="1000" alt="로그인2" src="https://github.com/user-attachments/assets/cf09a5ad-2ecd-4eb9-b690-010dbe8acd2c" />

### 3. 이메일 작성
받는 사람 이메일 입력 후 편하게 내용을 작성하고 톤앤매너를 선택합니다.  
내용 입력 시 감정 분석 모델로 감정을 파악하고, 해당 결과와 내용을 종합하여 AI가 적합한 톤앤매너를 추천해줍니다.  
변환 시 DB에 사용 기록이 저장되며, 나의 사용 패턴을 실시간으로 확인할 수 있습니다.

<img width="1000" alt="전송1" src="https://github.com/user-attachments/assets/542b79a2-641f-4eef-89d1-3b9e1af29f1b" />
<img width="1000" alt="전송2" src="https://github.com/user-attachments/assets/abfa73b8-32cd-45ce-a10a-1420c724a137" />
<img width="1000" alt="전송3" src="https://github.com/user-attachments/assets/1bc06f67-4442-489d-9c02-3254f5dffd0a" />
<img width="1000" alt="전송4" src="https://github.com/user-attachments/assets/4f0984fa-53fa-4b9d-936e-2d4ee734f464" />

### 4. AI 변환 결과 확인
선택한 톤앤매너로 변환을 진행한 후 변환된 제목과 본문을 확인합니다.  
변환 결과가 마음에 들지 않을 경우 직접 수정 후 전송할 수 있습니다.  
변환 이력이 히스토리 카드로 쌓이며, 카드 클릭 시 해당 결과로 바로 전환됩니다.

<img width="1000" alt="변환1" src="https://github.com/user-attachments/assets/626bd7bf-5ff3-43d0-abfe-811e431ab89c" />
<img width="1000" alt="변환2" src="https://github.com/user-attachments/assets/2fc327c7-a5ec-4d68-901e-0dd595e0b01e" />
<img width="1000" alt="변환3" src="https://github.com/user-attachments/assets/bb1df337-98ef-4aa0-96ab-d73315f53a9e" />

### 5. 실제 이메일 수신 확인
<img width="1000" alt="이메일 확인" src="https://github.com/user-attachments/assets/f4a684b5-69c4-47fc-b77b-83ff96e32964" />

<br>

## 🚀 실행 방법

### 환경변수 설정 (.env)
```
# React_Project
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_REDIRECT_URI=your_redirect_uri

# Colab_LLM
HF_TOKEN=your_huggingface_token
```

### Frontend
```bash
cd React_Project
npm install
npm run dev
```

### Backend
```bash
cd NodeJS_Project
npm install
node server.js
```
