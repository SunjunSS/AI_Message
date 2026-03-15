import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const hasRun = useRef(false); // 중복 실행 방지

  useEffect(() => {
    if (hasRun.current) return; // 이미 실행됐으면 종료
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        console.log('🔍 Google 콜백 처리 시작...');

        // ==========================================
        // 1단계: 데이터 추출
        // ==========================================
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token'); // 열쇠
        const expiresIn = params.get('expires_in'); // 유효기간
        const state = params.get('state'); // 보안코드

        console.log('🔑 Access Token:', accessToken ? '✅ 받음' : '❌ 없음');
        console.log('🔐 State:', state);

        // ==========================================
        // 2단계: 사전 검증 (네트워크 요청 전에 체크 가능한 것들)
        // ==========================================

        console.log('🛡️ 사전 검증 시작...');

        // 가드 1: State 검증
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
          console.error('❌ State 불일치!');
          throw new Error('State mismatch - 보안 검증 실패');
        }

        // 가드 2: Access Token 확인
        if (!accessToken) {
          console.error('❌ Access Token 없음!');
          throw new Error('Access token not found');
        }

        console.log('✅ 사전 검증 완료');

        // ==========================================
        // 3단계: API 호출 (필수 작업)
        // ==========================================

        console.log('👤 사용자 정보 요청 시작...');
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        // ==========================================
        // 4단계: 사후 검증 (API 응답 체크)
        // ==========================================

        console.log('🛡️ API 응답 검증 시작...');

        // 가드 3: API 응답 검증
        if (!userResponse.ok) {
          console.error('❌ API 요청 실패!');
          throw new Error('Failed to fetch user info');
        }

        const userData = await userResponse.json();
        console.log('✅ 사용자 정보:', userData);

        // ==========================================
        // 5단계: 모든 검증 통과! 데이터 저장
        // ==========================================

        console.log('💾 데이터 저장 시작...');

        // 토큰 저장
        sessionStorage.setItem('googleAccessToken', accessToken);
        sessionStorage.setItem('googleTokenExpiry',
          (Date.now() + parseInt(expiresIn || '3600') * 1000).toString()
        );

        // 사용자 정보 저장
        sessionStorage.setItem('userEmail', userData.email);
        sessionStorage.setItem('userName', userData.name);
        sessionStorage.setItem('loginProvider', 'google');

        console.log('✅ 모든 데이터 저장 완료!');

        // ==========================================
        // 6단계: 완료 처리
        // ==========================================

        console.log('✅ 로그인 완료!');
        alert(`✅ ${userData.name}님, 환영합니다!`);
        navigate('/compose');

      } catch (error) {
        console.error('❌ Google 인증 실패:', error);
        alert('❌ Google 로그인에 실패했습니다. 다시 시도해주세요.');
        navigate('/compose');
      }
    };

    handleCallback();
  }, [navigate]);

  // 인증 처리 중 로딩 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-lg font-semibold text-gray-900 mb-2">Google 로그인 처리 중...</p>
        <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
      </div>
    </div>
  );
};

export default GoogleCallback;