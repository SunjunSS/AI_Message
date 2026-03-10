import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Zap, RefreshCcw, Send, ChevronDown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const TONE_DATA = [
  {
    id: 0,
    emoji: "🎓",
    name: "정중한",
    target: "상사, 교수님",
    original: "교수님 저 내일 아파서 결석합니다.",
    result: "교수님, 안녕하십니까. 다름이 아니오라 내일 건강상의 사유로 부득이하게 수업에 참석하지 못하게 되어 양해를 구하고자 연락드립니다. 죄송합니다.",
    color: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    id: 1,
    emoji: "💼",
    name: "전문적인",
    target: "동료, 고객사",
    original: "회의 자료 보냅니다. 확인 부탁해요.",
    result: "회의 자료를 첨부하여 송부드립니다. 3월 7일까지 검토 후 회신 주시면 감사하겠습니다. 추가 논의가 필요하시면 언제든 연락 주시기 바랍니다.",
    color: "text-slate-700 bg-slate-100 border-slate-300"
  },
  {
    id: 2,
    emoji: "💡",
    name: "설득적인",
    target: "투자자, 협업 대상",
    original: "이 프로젝트 같이 하면 좋을 것 같아요.",
    result: "이번 프로젝트를 함께 진행하신다면 귀사의 기술력과 저희 마케팅 역량이 시너지를 낼 수 있을 것으로 기대됩니다. 협업을 통해 6개월 내 시장 점유율 20% 향상이라는 목표 달성이 가능할 것입니다.",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    id: 3,
    emoji: "🙏",
    name: "공손한",
    target: "민원인, 고객",
    original: "죄송한데 약속 시간 좀 미뤄도 될까요?",
    result: "급한 업무가 생겨 약속 시간을 지키지 못하게 되었습니다. 정말 죄송합니다. 오후 3시 이후로 조정 가능하실까요? 불편을 드려 다시 한번 사과드립니다.",
    color: "text-orange-500 bg-orange-50 border-orange-200"
  },
  {
    id: 4,
    emoji: "🤝",
    name: "협조적인",
    target: "팀원, 선배",
    original: "자료 좀 보내주시면 안될까요?",
    result: "바쁘신 와중에 번거로우시겠지만, 기획안 작성을 위해 지난주 회의록을 공유해 주실 수 있으실까요? 이번 주 금요일까지 받을 수 있다면 정말 감사하겠습니다. 어려우시면 말씀해 주세요!",
    color: "text-purple-600 bg-purple-50 border-purple-200"
  }
];

const MainHome = () => {
  const [activeTone, setActiveTone] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-[#F9FAFB] text-gray-900 font-sans hide-scrollbar">

      {/* 1. Hero Section */}
      <section className="relative snap-start snap-always h-screen min-h-[600px] flex flex-col justify-center items-center text-center px-4 md:px-6 bg-white overflow-hidden w-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[100px] opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[100px] opacity-70"></div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={fadeUpVariant}
          className="max-w-4xl w-full z-10 flex flex-col items-center mt-10 md:mt-0"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-4 md:mb-6 leading-tight">
            어려운 이메일 작성,<br />
            <span className="text-blue-600">이제 AI에게 맡기세요.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-8 md:mb-12 font-medium px-4">
            편하게 쓰고 톤앤매너만 고르세요. 변환부터 전송까지 한 번에.
          </p>

          {/* 플로팅 애니메이션 wrapper */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2.3,
              repeat: Infinity,
              times: [0, 0.5, 1],
              ease: ["easeInOut", "easeInOut"],
            }}
            className="w-full max-w-sm md:max-w-lg"
          >
            {/* 카드는 별도 div로 분리 */}
            <div
              style={{
                transform: "translate3d(0,0,0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                isolation: "isolate",
              }}
              className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 text-left cursor-default"
            >
              {/* 위쪽: 내가 쓴 말 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-4 opacity-80">
                <span className="w-fit bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">내가 쓴 말</span>
                <p className="text-gray-600 text-sm mt-1 sm:mt-0 leading-snug">교수님 저 내일 아파서 결석합니다. 죄송합니다.</p>
              </div>

              {/* 아래쪽: 정중한 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 opacity-80">
                <span className="w-fit bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1">
                  <Sparkles size={12} /> 정중한
                </span>
                <p className="text-gray-900 font-medium text-sm md:text-[15px] leading-relaxed mt-1 sm:mt-0">
                  교수님, 안녕하십니까. 다름이 아니오라 내일 건강상의 사유로 부득이하게 수업에 참석하지 못하게 되어 양해를 구하고자 연락 올립니다.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-6 md:bottom-10 text-gray-400 z-10 hidden sm:block"
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* 2. Problem Section */}
      <section className="snap-start snap-always h-screen min-h-[600px] flex flex-col justify-center items-center px-4 md:px-6 bg-black text-white text-center w-full py-16 md:py-0">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={fadeUpVariant}
          className="max-w-5xl mx-auto w-full"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-10 md:mb-16 leading-snug">
            교수님, 면접관, 직장 상사...<br />
            메일 보낼 때마다 망설여지셨나요?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 text-left">
            {[
              { title: "어려운 격식", desc: "어떤 단어를 써야 할지 고민하느라 버려지는 시간들" },
              { title: "번거로운 챗GPT", desc: "AI를 쓰려 해도 매번 프롬프트를 입력해야 하는 귀찮음" },
              { title: "복잡한 과정", desc: "작성하고, 복사하고, 이메일 앱을 켜서 붙여넣는 수고로움" }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-800">
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-blue-400">{item.title}</h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. Solution Section */}
      <section className="snap-start snap-always h-screen min-h-[600px] flex flex-col justify-center items-center px-4 md:px-6 bg-white text-center w-full py-16 md:py-0">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={fadeUpVariant}
          className="max-w-6xl mx-auto w-full"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
            생각나는 대로 쓰세요.<br className="hidden sm:block" />포장은 저희가 할게요.
          </h2>
          <p className="text-base md:text-xl text-gray-500 mb-10 md:mb-20">단 4단계면 완벽한 이메일이 완성됩니다.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: <Mail size={32} className="md:w-10 md:h-10" />, title: "1. 이메일 입력", desc: "받는 사람의 이메일을 입력합니다." },
              { icon: <Zap size={32} className="md:w-10 md:h-10" />, title: "2. 내용 작성", desc: "구어체, 반말 상관없이 편하게 쓰세요." },
              { icon: <RefreshCcw size={32} className="md:w-10 md:h-10" />, title: "3. 톤앤매너 선택", desc: "상황에 맞는 스타일을 고르세요." },
              { icon: <Send size={32} className="md:w-10 md:h-10" />, title: "4. 확인 및 전송", desc: "AI가 바꾼 내용을 확인하고 바로 보내세요." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 md:p-6">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 md:mb-6">
                  {step.icon}
                </div>
                <h3 className="text-lg md:text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-xs md:text-base text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 4. Tones Section */}
      <section className="snap-start snap-always h-screen min-h-[600px] flex flex-col justify-center items-center px-4 md:px-6 bg-gray-50 w-full py-12 md:py-0 overflow-y-auto md:overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={fadeUpVariant}
          className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row gap-6 md:gap-12 items-center"
        >
          {/* 좌측: 타이틀 및 톤 선택 메뉴 */}
          <div className="w-full lg:w-1/3 flex flex-col text-center lg:text-left mt-10 md:mt-0">
            <h2 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">
              상황에 맞는<br className="hidden lg:block" /> 5가지 톤앤매너
            </h2>
            <p className="text-sm md:text-lg text-gray-500 mb-4 md:mb-8">버튼을 눌러 실시간 변환을 확인해보세요.</p>

            <div className="flex flex-row lg:flex-col gap-2 md:gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide w-full px-1">
              {TONE_DATA.map((tone, idx) => (
                <button
                  key={tone.id}
                  onClick={() => setActiveTone(idx)}
                  className={`flex items-center justify-center lg:justify-start gap-2 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 border-2 min-w-[120px] lg:min-w-0 flex-shrink-0
                    ${activeTone === idx
                      ? `${tone.color} shadow-md transform scale-[1.02] bg-white`
                      : 'bg-white border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  <span className="text-xl md:text-3xl">{tone.emoji}</span>
                  <div className="text-left hidden sm:block">
                    <h3 className={`font-bold text-sm md:text-lg ${activeTone === idx ? '' : 'text-gray-700'}`}>{tone.name}</h3>
                    <p className={`text-xs ${activeTone === idx ? 'opacity-80' : 'text-gray-400'} hidden lg:block`}>{tone.target}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 우측: 이메일 UI Mockup */}
          <div className="w-full lg:w-2/3 h-auto min-h-[350px] md:h-[500px] bg-white rounded-2xl md:rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200 overflow-hidden flex flex-col flex-shrink-0">
            {/* 맥 OS 창 상단 */}
            <div className="bg-gray-100 h-8 md:h-12 flex items-center px-3 md:px-4 gap-1.5 md:gap-2 border-b border-gray-200">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
            </div>

            {/* 이메일 헤더 */}
            <div className="p-4 md:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                <span className="text-gray-400 w-8 md:w-12 text-xs md:text-sm font-medium">To.</span>
                <div className="bg-gray-100 px-2 md:px-3 py-1 rounded-md text-xs md:text-sm text-gray-700 font-medium truncate">
                  {TONE_DATA[activeTone].target}
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-gray-400 w-8 md:w-12 text-xs md:text-sm font-medium">Sub.</span>
                <div className="text-gray-900 font-bold text-sm md:text-base truncate">
                  {activeTone === 4 ? "Document attached" : "연락드립니다."}
                </div>
              </div>
            </div>

            {/* 변환 애니메이션 컨텐츠 영역 */}
            <div className="flex-1 p-4 md:p-8 flex flex-col gap-4 md:gap-8 bg-[#F8FAFC]">
              <div>
                <span className="inline-block bg-gray-200 text-gray-500 text-[10px] md:text-xs font-bold px-2 py-1 rounded mb-2">내가 작성한 내용</span>
                <p className="text-gray-400 md:text-gray-500 text-sm md:text-lg line-through decoration-gray-300">
                  {TONE_DATA[activeTone].original}
                </p>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-[10px] md:text-xs font-bold px-2 py-1 rounded mb-2">
                  <Sparkles size={10} className="md:w-3 md:h-3" /> AI 변환 완료
                </span>
                <motion.div
                  key={activeTone}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-base sm:text-lg md:text-2xl text-gray-900 font-medium leading-relaxed">
                    {TONE_DATA[activeTone].result}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. Bottom CTA Section */}
      <section className="relative snap-start snap-always h-screen min-h-[500px] flex flex-col justify-center items-center px-4 md:px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white text-center overflow-hidden w-full">

        <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-white opacity-5 rounded-full blur-[50px] md:blur-[80px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-indigo-400 opacity-20 rounded-full blur-[60px] md:blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={fadeUpVariant}
          className="max-w-3xl mx-auto w-full z-10"
        >
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="bg-white/20 backdrop-blur-md p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/30 shadow-2xl">
              <Send size={36} className="text-white md:w-12 md:h-12" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            지금 바로 완벽한 이메일을<br />작성해 보세요.
          </h2>
          <p className="text-base sm:text-lg md:text-2xl text-blue-200 mb-8 md:mb-10 font-light px-4">
            가입부터 첫 이메일 전송까지, 단 1분이면 충분합니다.
          </p>
          <button
            onClick={() => navigate('/compose')}
            className="bg-white text-blue-600 font-bold text-lg md:text-xl py-4 md:py-5 px-10 md:px-14 rounded-full shadow-2xl hover:bg-gray-50 hover:scale-105 transition-all duration-300"
          >
            서비스 시작하기
          </button>
        </motion.div>
      </section>

    </div>
  );
};

export default MainHome;