const GoogleLoginButton = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const state = Math.random().toString(36).substring(7);

  const handleGoogleLogin = () => {
    // 앱에서 Gmail 발송 및 사용자 정보(이메일, 프로필) 접근을 허용
    const scope = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    // Google OAuth URL 생성
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=${state}`;

    // State 저장 (검증용)
    sessionStorage.setItem('oauth_state', state);

    // Google 로그인 페이지로 이동
    window.location.href = googleAuthUrl;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg border border-gray-200"
    >
      {/* Google 로고 SVG */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.4818C15.2273 13.3 14.4727 14.3591 13.3636 15.0682V17.5773H16.7182C18.7091 15.7364 19.8 13.2273 19.8 10.2273Z" fill="#4285F4" />
        <path d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3636 15.0682C12.4273 15.6682 11.2773 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.1636 4.36364 11.7273H0.890909V14.3182C2.63636 17.7909 6.09091 20 10 20Z" fill="#34A853" />
        <path d="M4.36364 11.7273C4.14545 11.1273 4.02273 10.4773 4.02273 9.81818C4.02273 9.15909 4.14545 8.50909 4.36364 7.90909V5.31818H0.890909C0.204545 6.68182 -0.181818 8.20455 -0.181818 9.81818C-0.181818 11.4318 0.204545 12.9545 0.890909 14.3182L4.36364 11.7273Z" fill="#FBBC05" />
        <path d="M10 3.61364C11.3909 3.61364 12.6409 4.10909 13.6364 5.04545L16.6091 2.07273C14.9591 0.522727 12.6955 -0.363636 10 -0.363636C6.09091 -0.363636 2.63636 1.84545 0.890909 5.31818L4.36364 7.90909C5.19091 5.47273 7.39545 3.61364 10 3.61364Z" fill="#EA4335" />
      </svg>
      Google로 시작하기
    </button>
  );
};

export default GoogleLoginButton;


// return 영역, <태그> ~~ </태그> 안 = JSX = {/* */}
// 나머지 = JavaScript
// 단, { } 안은 JavaScript = //