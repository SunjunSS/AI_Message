import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, Send, Edit3, Check, Loader2, ArrowLeft, User, Shield } from 'lucide-react';
import GoogleLoginButton from './GoogleLogin';
// default export: 파일당 1개, 중괄호 없이 import → 컴포넌트
// named export: 파일당 여러개, 중괄호로 import → 타입/함수 등
import MessageHistory, { HistoryItem } from './MessageHistory';
import StatsDashboard from './StatsDashboard';

// ColorType: 톤앤매너 버튼에서 사용 가능한 색상 값을 제한
// 5가지 색상 외에는 사용 불가 (오타, 없는 색상 방지)
type ColorType = 'blue' | 'slate' | 'emerald' | 'orange' | 'purple'

// TONE_OPTIONS 타입 정의 추가
type ToneOption = {
  id: string
  emoji: string
  name: string
  target: string
  color: ColorType
}

const TONE_OPTIONS: ToneOption[] = [
  { id: 'polite', emoji: '🎓', name: '정중한', target: '상사, 교수님', color: 'blue' },
  { id: 'professional', emoji: '💼', name: '전문적인', target: '동료, 고객사', color: 'slate' },
  { id: 'persuasive', emoji: '💡', name: '설득적인', target: '투자자, 협업 대상', color: 'emerald' },
  { id: 'apologetic', emoji: '🙏', name: '공손한', target: '민원인, 고객', color: 'orange' },
  { id: 'cooperative', emoji: '🤝', name: '협조적인', target: '팀원, 선배', color: 'purple' }
];

// 안전한 Base64 인코딩 함수 (UTF-8 지원)
// string을 받아 string 반환 → btoa()가 항상 string 반환하므로 타입 자동 추론 가능
// strict: true 환경에서 매개변수 타입 추론 불가 → str: string 명시 필요
// strict: false면 암묵적 any로 허용되지만 strict: true면 오류
const base64EncodeUnicode = (str: string): string => {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const MessageCompose = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [convertedSubject, setConvertedSubject] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  // 초기값 null이지만 선택 시 tone.id(string)가 저장되므로 string | null 명시
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [convertedMessage, setConvertedMessage] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // 본문 영역의 편집 상태 관리
  const [isEditingSubject, setIsEditingSubject] = useState(false);  // 제목 영역의 편집 상태 관리
  const [step, setStep] = useState(0);
  // 초기값 빈 배열, 추천 톤 id(string)들을 담는 배열이므로 string[] 명시
  const [recommendedTones, setRecommendedTones] = useState<string[]>([]);  // 추천 톤 키 리스트
  const [isAnalyzing, setIsAnalyzing] = useState(false);         // 감정 분석 중 여부
  // 변환된 히스토리 아이템들을 배열로 저장, 변환 시 앞에 추가
  const [history, setHistory] = useState<HistoryItem[]>([]);
  // 현재 화면에 표시 중인 히스토리 아이템의 id, 선택된 카드 강조 효과
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);
  // StatsDashboard 재조회 신호 - 값이 바뀔 때마다 통계를 다시 불러옴
  const [statsTrigger, setStatsTrigger] = useState(0);

  // 이메일 형식 체크 함수(정규식)
  // string을 받아 boolean 반환 → .test()가 항상 boolean 반환하므로 타입 자동 추론 가능
  const isValidEmail = (email: string): boolean => {
    // 간단하고 안전한 이메일 패턴 (RFC 5322의 권장범위 내)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('userEmail');
    const savedName = sessionStorage.getItem('userName');
    const accessToken = sessionStorage.getItem('googleAccessToken');

    if (savedEmail && accessToken) {
      setIsLoggedIn(true);
      setSenderEmail(savedEmail);
      setSenderName(savedName || '');
      setStatsTrigger(prev => prev + 1);  // 값 변화 자체가 StatsDashboard에 통계 재조회 신호를 보냄
      setStep(1);
    }
  }, []);

  // 로그아웃 동작: 세션 및 입력값 초기화 후 이메일 작성 화면으로 복귀
  const handleLogout = () => {
    setIsLoggedIn(false);
    setSenderEmail('');
    setSenderName('');
    setStep(0);
    sessionStorage.clear();
    window.location.href = '/compose';
  };

  // 입력값 및 진행상태 초기화 (변환 결과 후, 또는 재작성시 사용)
  const handleReset = () => {
    setRecipientEmail('');
    setEmailSubject('');
    setOriginalMessage('');
    setSelectedTone(null);
    setConvertedMessage('');
    setStep(isLoggedIn ? 1 : 0);
    setIsEditing(false);
  };

  // 텍스트 입력 시 감정 분석 후 추천 톤 자동 업데이트
  const handleAnalyze = async () => {
    if (!originalMessage.trim()) return; // 빈 텍스트면 실행 안 함

    setIsAnalyzing(true);

    try {
      // 1. Node.js 백엔드로 감정 분석 + 톤 추천 요청
      // 백엔드 서버 엔드포인트: port 3000의 /api/analyze
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalMessage })
      });

      if (!response.ok) throw new Error('감정 분석 실패');

      const data = await response.json();

      console.log('✅ 추천 톤 데이터:', data.recommended_tones);  // 추가
      console.log('✅ recommendedTones 설정 전:', recommendedTones);  // 추가
      // data.recommended_tones = ["professional", "polite"] 형태로 받아옴
      setRecommendedTones(data.recommended_tones);  // 추천 톤 저장

    } catch (error) {
      // catch의 error는 unknown 타입 → as Error로 타입 명시
      const err = error as Error;
      console.error('❌ 감정 분석 실패:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 타이핑 멈추면 자동으로 감정 분석
  useEffect(() => {
    // 텍스트 비어있으면 초기화하고 종료
    if (!originalMessage.trim()) {
      setRecommendedTones([]);  // 텍스트 지우면 추천 초기화
      setSelectedTone(null);    // 텍스트 지우면 선택 톤 초기화
      return;
    }

    const timer = setTimeout(() => {
      handleAnalyze();
    }, 1000);  // 1초 후 자동 호출

    return () => clearTimeout(timer);  // 타이핑 중이면 타이머 초기화
  }, [originalMessage]);


  // AI 변환 버튼 클릭 시(제목, 본문 모두 톤앤매너에 맞게 AI 변환)
  const handleConvert = async () => {
    if (!originalMessage.trim() || !selectedTone) return;  // 본문,톤 미입력시 변환 불가

    setIsConverting(true);

    try {
      // 1. Node.js 백엔드로 본문 변환 요청
      // 백엔드 서버 엔드포인트: port 3000의 /api/tone-convert
      // handleConvert는 async 함수 → await 방식으로 호출
      const messageResponse = await fetch('http://localhost:3000/api/tone-convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 프론트에서 JSON 형식으로 데이터 전달
        body: JSON.stringify({
          message: originalMessage,
          tone: selectedTone,
          is_subject: false  // 하나의 엔드포인트에서 본문 구분 위해 false 전달
        })
      });

      if (!messageResponse.ok) {
        throw new Error('본문 변환 실패');
      }

      const messageData = await messageResponse.json();  // 변환된 본문 데이터를 JSON 형식으로 파싱

      // 2. Node.js 백엔드로 제목 변환 요청 (변환된 본문을 전달)
      // 백엔드 서버 엔드포인트: port 3000의 /api/tone-convert
      // handleConvert는 async 함수 → await 방식으로 호출
      const subjectResponse = await fetch('http://localhost:3000/api/tone-convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 프론트에서 JSON 형식으로 데이터 전달
        body: JSON.stringify({
          message: emailSubject.trim(),
          context: messageData.converted,  // 변환된 본문을 제목 변환 시 전달
          tone: selectedTone,
          is_subject: true  // 하나의 엔드포인트에서 제목 구분 위해 true 전달
        })
      });

      if (!subjectResponse.ok) {
        throw new Error('제목 변환 실패');
      }

      const subjectData = await subjectResponse.json();  // 변환된 제목 데이터를 JSON 형식으로 파싱

      setConvertedSubject(subjectData.converted);   // 백엔드에서 받은 변환된 제목을 상태 변수에 저장
      setConvertedMessage(messageData.converted);   // 백엔드에서 받은 변환된 본문을 상태 변수에 저장

      // 변환 완료 후 히스토리 아이템 생성
      const newItem: HistoryItem = {
        id: Date.now(),  // 현재 시간을 고유 id로 사용
        tone: selectedTone!,  // 선택된 톤 id
        toneEmoji: TONE_OPTIONS.find(t => t.id === selectedTone)?.emoji || '',  // selectedTone(톤의 id값)으로 TONE_OPTIONS에서 해당 이모지 조회
        toneColor: TONE_OPTIONS.find(t => t.id === selectedTone)?.color || 'blue',
        toneName: TONE_OPTIONS.find(t => t.id === selectedTone)?.name || '',
        subject: subjectData.converted,  // 변환된 제목
        message: messageData.converted,  // 변환된 본문
        createdAt: new Date(),  // 생성 시간
      };
      setHistory(prev => [newItem, ...prev]);  // 히스토리 배열 맨 앞에 추가 (최신순)
      setCurrentHistoryId(newItem.id);  // 방금 생성한 아이템을 현재 선택 상태로 지정

      // 3. MySQL에 통계 저장
      // 백엔드 서버 엔드포인트: port 3000의 /api/stats/save
      // handleConvert는 async 함수 → await 방식으로 호출
      try {
        const statsResponse = await fetch('http://localhost:3000/api/stats/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: senderEmail,
            name: senderName,
            tone: selectedTone
          })
        });

        if (!statsResponse.ok) {
          throw new Error('통계 저장 실패');
        }

        // 저장 성공 시에만 +1 → StatsDashboard 통계 재조회 트리거
        setStatsTrigger(prev => prev + 1); 

      } catch (statsError) {
        // 통계 저장 실패는 변환 실패와 별개로 처리
        console.error('⚠️ 통계 저장 실패:', statsError);
        alert('통계 저장에 실패했습니다. 사용 통계가 정확하지 않을 수 있어요.');
      }

      setIsConverting(false);
      setStep(2);

    } catch (error) {
      // catch의 error는 unknown 타입 → as Error로 타입 명시
      const err = error as Error;
      console.error('❌ AI 변환 실패:', err);
      alert('AI 변환에 실패했습니다. 다시 시도해주세요.');
      setIsConverting(false);
    }
  };

  // Gmail API를 통한 실제 이메일 전송
  const sendViaGmail = async () => {
    const accessToken = sessionStorage.getItem('googleAccessToken');

    if (!accessToken) {
      alert('❌ Google 로그인이 필요합니다.');
      handleLogout();
      return;
    }

    if (!isValidEmail(recipientEmail)) {
      alert('❌ 받는 사람 이메일 주소가 올바르지 않습니다.');
      setIsSending(false);
      return;
    }

    setIsSending(true);

    try {
      console.log('📧 Gmail API로 전송 시작...');

      const subject = convertedSubject.trim();

      if (!subject) {
        alert('❌ 제목을 입력해주세요.');
        setIsSending(false);
        return;
      }

      const encodedSenderName =
        senderName
          ? `=?UTF-8?B?${base64EncodeUnicode(senderName)}?=`
          : senderEmail;

      const emailLines = [
        `To: ${recipientEmail}`,
        `From: ${encodedSenderName} <${senderEmail}>`,
        `Subject: =?UTF-8?B?${base64EncodeUnicode(subject)}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        base64EncodeUnicode(convertedMessage)
      ];

      const email = emailLines.join('\r\n');

      const encodedEmail = base64EncodeUnicode(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      console.log('📧 Gmail API 호출 중...');
      console.log('보내는사람:', senderEmail);
      console.log('받는사람:', recipientEmail);
      console.log('제목:', subject);

      // Gmail API 호출 및 성공,에러 처리
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Gmail API 에러:', error);

        if (response.status === 401) {
          throw new Error('로그인이 만료되었습니다');
        }

        throw new Error(error.error?.message || '전송 실패');
      }

      const data = await response.json();
      console.log('✅ Gmail 전송 성공:', data);

      setIsSending(false);
      alert(`✅ ${recipientEmail}로 이메일이 성공적으로 전송되었습니다!\n\n${senderEmail} Gmail의 보낸 편지함을 확인해보세요!`);
      handleReset();

    } catch (error) {
      // catch의 error는 unknown 타입 → as Error로 타입 명시
      const err = error as Error;
      console.error('❌ Gmail 전송 실패:', err);
      setIsSending(false);

      if (err.message && err.message.includes('만료')) {
        alert('❌ 로그인이 만료되었습니다. 다시 로그인해주세요.');
        handleLogout();
      } else {
        alert(`❌ 이메일 전송에 실패했습니다.\n\n${err.message}`);
      }
    }
  };

  // 이메일 전송 버튼 클릭 핸들러
  const handleSend = async () => {
    await sendViaGmail();
  };

  // AI 추천 톤: 글로우 효과 클래스 반환
  // string 대신 ColorType으로 타입 지정하여 colors 객체에 없는 키 접근 방지
  const getPulseClass = (color: ColorType): string => {
    const colors = {
      blue: 'pulse-blue',
      slate: 'pulse-slate',
      emerald: 'pulse-emerald',
      orange: 'pulse-orange',
      purple: 'pulse-purple',
    };
    return colors[color] || colors.blue;
  };

  // 톤앤매너 버튼 스타일(선택,미선택) 클래스 반환
  // string 대신 ColorType으로 타입 지정하여 colors 객체에 없는 키 접근 방지
  const getColorClasses = (color: ColorType, active = false): string => {
    const colors = {
      blue: active ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-blue-50 hover:border-blue-200',
      slate: active ? 'bg-slate-50 border-slate-500 text-slate-700' : 'hover:bg-slate-50 hover:border-slate-200',
      emerald: active ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'hover:bg-emerald-50 hover:border-emerald-200',
      orange: active ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-orange-50 hover:border-orange-200',
      purple: active ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-purple-50 hover:border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={24} />
              AI 메시지 작성
            </h1>
          </div>

          {/* 로그인/로그아웃 상태에 따른 사용자 정보 영역 */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* 로그인된 사용자의 이름,이메일 */}
              <span className="text-sm text-gray-600 hidden sm:inline">
                {senderName || senderEmail}
              </span>
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
              >
                로그아웃
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {/* Step 0: 로그인 단계 */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-10 text-center">
                {/* 로그인 안내 아이콘/문구 */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="text-blue-600" size={32} />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  이메일 작성을 시작하세요
                </h2>
                <p className="text-gray-600 mb-8">
                  Google로 로그인하여<br />
                  AI 메시지 작성 서비스를 이용하세요
                </p>

                <GoogleLoginButton />

                <p className="text-xs text-gray-500 mt-6">
                  로그인하면 Gmail 발송 권한에 동의하게 됩니다
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 1: 작성 단계 */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 보내는 사람 정보(로그인된 이메일, 인증 표시) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User size={18} className="text-blue-600" />
                  보내는 사람
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={senderEmail}
                    disabled  // 인증된 이메일은 수정 불가
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  {/* 인증됨 아이콘/표시 */}
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap">
                    <Check size={14} />
                    인증됨
                  </div>
                </div>
              </div>

              {/* 받는 사람 이메일 입력 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Mail size={18} className="text-blue-600" />
                  받는 사람
                </label>
                <input
                  type="email"
                  // recipientEmail: 사용자가 입력 -> onChange에서 setRecipientEmail로 상태 업데이트 -> 입력값 그대로 반영
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                />
                {recipientEmail && !isValidEmail(recipientEmail) && (
                  <p className="text-xs text-red-500 mt-2">
                    올바른 이메일 주소를 입력하세요.
                  </p>
                )}
              </div>

              {/* 메시지(제목, 본문) 입력 영역 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Edit3 size={18} className="text-blue-600" />
                  하고 싶은 말을 편하게 작성하세요
                </label>

                {/* 제목 입력 */}
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="제목"
                  className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                />

                {/* 본문 입력 */}
                <textarea
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  placeholder="예: 교수님 내일 아파서 결석합니다. 죄송합니다."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    💡 제목과 본문을 입력하면 톤앤매너에 맞게 변환해드려요
                  </p>
                  <span className="text-xs text-gray-400">
                    {originalMessage.length} / 1000자
                  </span>
                </div>
              </div>

              {/* 톤앤매너 선택 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Sparkles size={18} className="text-blue-600" />
                  톤앤매너 선택
                </label>

                {/* flex로 톤 버튼들과 통계 대시보드를 좌우 배치 */}
                <div className="flex gap-4 items-start">

                  {/* 왼쪽: 톤 버튼들 */}
                  <div className="flex-1 flex flex-wrap justify-center gap-3">
                    {TONE_OPTIONS.map((tone) => {
                      console.log(tone.id, '포함여부:', recommendedTones.includes(tone.id));
                      return (
                        <button
                          key={tone.id}
                          // 톤 선택,취소 토글 (같은 톤 재클릭 시 선택 해제)
                          onClick={() => setSelectedTone(selectedTone === tone.id ? null : tone.id)}
                          disabled={isConverting}
                          className={`relative p-4 rounded-xl border-2 text-left w-[calc(50%-0.375rem)]
                            transition-all duration-300
                            ${isConverting ? 'cursor-not-allowed' : ''}
                            ${selectedTone === tone.id  // 선택된 톤 -> getColorClasses()
                              ? getColorClasses(tone.color, true) + ' shadow-md'
                              : 'border-gray-200 bg-white ' + getColorClasses(tone.color)
                            }
                            ${recommendedTones.includes(tone.id) && selectedTone === null  // 추천된 톤 -> getPulseClass()
                              ? getPulseClass(tone.color)  // 선택된 톤이 없을 때만 글로우 효과
                              : ''
                            }
                        `}
                        >
                          {selectedTone === tone.id && (
                            <div className="absolute top-2 right-2">
                              <Check size={18} className="text-current" />
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">{tone.emoji}</span>
                            <span className="font-bold text-base">{tone.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 ml-9">{tone.target}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* 오른쪽: 통계 사이드 패널 */}
                  {/* MessageCompose의 senderEmail(로그인 이메일), statsTrigger(재조회 신호)를 */}
                  {/* StatsDashboard의 email, statsTrigger props로 넘겨서 통계 UI를 그림 */}
                  <StatsDashboard email={senderEmail} statsTrigger={statsTrigger} />

                </div>
              </div>

              {/* AI 변환 버튼 (입력값,상태 모두 충족시만 활성화) */}
              <button
                onClick={handleConvert}
                // 입력값 없거나 변환 진행중이면 비활성화
                disabled={!isValidEmail(recipientEmail) || !emailSubject.trim() || !originalMessage.trim() || !selectedTone || isConverting}
                className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    AI 변환 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    AI로 변환하기
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 2: 변환 결과 */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 이메일 정보 표시(보내는 사람, 받는 사람, 변환 제목) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span className="font-medium">보내는 사람:</span>
                  <span className="text-gray-900 font-semibold">{senderEmail}</span>
                  <Check size={14} className="text-green-600" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} />
                  <span className="font-medium">받는 사람:</span>
                  <span className="text-gray-900 font-semibold">{recipientEmail}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  {/* 첫 줄: 원본 제목 */}
                  <div className="flex items-center gap-2">
                    <Edit3 size={16} />
                    <span className="font-medium">원본 제목:</span>
                    <span className="text-gray-400 line-through decoration-gray-300">{emailSubject}</span>
                  </div>
                  {/* 두 번째 줄: AI 변환 완료 디자인 */}
                  <div className="flex items-center gap-2 mt-1">
                    {/* AI 변환 완료 아이콘 + 텍스트 */}
                    <span className="flex items-center gap-1 font-bold text-blue-600">
                      <Sparkles size={18} className="text-blue-600" />
                      AI 변환 제목:
                    </span>
                    {/* 변환 제목, 수정 UI */}
                    {isEditingSubject ? (
                      <>
                        <input
                          type="text"
                          value={convertedSubject}  // 변환된 제목을 input 값으로 표시
                          onChange={e => setConvertedSubject(e.target.value)}  // 입력값이 바뀔 때 상태 변수에 저장
                          className="px-2 py-1 border border-gray-300 rounded-md text-blue-900 font-bold text-base flex-1"
                          style={{ minWidth: "180px" }}
                        />
                        <button
                          // 제목 수정 완료 버튼 클릭 시 편집 모드 종료
                          onClick={() => {
                            setIsEditingSubject(false);
                            // 히스토리 아이템 중 id가 현재 선택된 히스토리 아이템의 id와 같은 아이템을 찾아서 subject를 수정된 convertedSubject로 업데이트
                            setHistory(prev => prev.map(item =>
                              item.id === currentHistoryId
                                ? { ...item, subject: convertedSubject }
                                : item
                            ));
                          }}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <Check size={14} />
                          완료
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-blue-900 font-bold">{convertedSubject}</span>
                        <button
                          onClick={() => setIsEditingSubject(true)}  // 제목 수정 버튼 클릭 시 편집 모드로 진입
                          className="ml-2 text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 size={14} />
                          수정
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 원본 메시지 */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  원본 메시지
                </div>
                <p className="text-gray-600 line-through decoration-gray-400">
                  {originalMessage}
                </p>
              </div>

              {/* AI 변환 결과 */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                    <Sparkles size={16} />
                    AI 변환 메시지
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded text-xs">
                      {TONE_OPTIONS.find(t => t.id === selectedTone)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        // 히스토리 아이템 중 id가 현재 선택된 히스토리 아이템의 id와 같은 아이템을 찾아서 message를 수정된 convertedMessage로 업데이트
                        setHistory(prev => prev.map(item =>
                          item.id === currentHistoryId
                            ? { ...item, message: convertedMessage }
                            : item
                        ));
                      }
                      setIsEditing(!isEditing);
                    }}
                    className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 size={14} />
                    {isEditing ? '완료' : '수정'}
                  </button>
                </div>

                {/* 실제 변환 결과(수정 or 보기) */}
                {isEditing ? (
                  <textarea
                    value={convertedMessage}  // 변환된 메시지를 textarea 값으로 표시
                    onChange={(e) => setConvertedMessage(e.target.value)}  // 입력값이 바뀔 때 상태 변수에 저장
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                  />
                ) : (
                  <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {convertedMessage}
                  </p>
                )}
              </div>

              {/* MessageCompose의 history(히스토리 배열), currentHistoryId(현재 선택된 id)를 */}
              {/* MessageHistory의 history, currentId props로 넘겨서 카드 목록 UI를 그림 */}
              <MessageHistory
                history={history}
                currentId={currentHistoryId}
                // 부모가 정의한 함수
                // 자식(MessageHistory)이 카드 클릭 시 클릭한 카드의 HistoryItem 객체를 item에 채워서 실행
                onSelect={(item) => {
                  setConvertedSubject(item.subject);  // 클릭한 카드의 제목을 화면에 반영
                  setConvertedMessage(item.message);
                  setSelectedTone(item.tone);
                  setCurrentHistoryId(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });  // 페이지 맨 위로 부드럽게 스크롤
                }}
              />

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedTone(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  이전 단계로
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending} // 전송 중에는 버튼 비활성화
                  className="flex-1 bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      이메일 전송하기
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MessageCompose;