import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp } from 'lucide-react';

// 톤 id로 이모지, 이름, 색상 클래스 매핑
const TONE_META: Record<string, { emoji: string; name: string; color: string }> = {
  polite: { emoji: '🎓', name: '정중한', color: 'blue' },
  professional: { emoji: '💼', name: '전문적인', color: 'slate' },
  persuasive: { emoji: '💡', name: '설득적인', color: 'emerald' },
  apologetic: { emoji: '🙏', name: '공손한', color: 'orange' },
  cooperative: { emoji: '🤝', name: '협조적인', color: 'purple' },
};

// 색상 이름으로 Tailwind 바 색상 클래스 매핑
const BAR_COLORS: Record<string, string> = {
  blue: 'bg-blue-400',
  slate: 'bg-slate-400',
  emerald: 'bg-emerald-400',
  orange: 'bg-orange-400',
  purple: 'bg-purple-400',
};

// 색상 이름으로 Tailwind 텍스트 색상 클래스 매핑
const TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-500',
  slate: 'text-slate-500',
  emerald: 'text-emerald-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
};

// StatsDashboard 컴포넌트가 부모(MessageCompose)로부터 받을 props 타입 정의
// props: 부모 컴포넌트가 자식 컴포넌트에게 데이터를 전달하는 방법
type StatsDashboardProps = {
  email: string;
  statsTrigger: number;
};

// 부모(MessageCompose)로부터 email(사용자 이메일), statsTrigger(재조회 트리거)를 props로 받음
const StatsDashboard = ({ email, statsTrigger }: StatsDashboardProps) => {

  // 1. 톤별 사용 횟수 (많이 쓴 순 정렬)
  const [toneStats, setToneStats] = useState<{ tone: string; count: number }[]>([]);

  // 2. 총 변환 횟수 → DB에서 가져옴
  const [total, setTotal] = useState(0);

  // 3. 가장 많이 쓴 톤
  // toneStats에서 첫 번째 아이템, total이 0이면 null
  const topTone = toneStats[0] ?? null;

  // 4. 오늘 변환 횟수 → DB에서 가져옴
  const [todayCount, setTodayCount] = useState(0);

  // 재마운트 시 중복 조회 방지
  const prevTriggerRef = useRef(0);

  // DB에서 통계 조회
  useEffect(() => {
    // 이메일 없거나 초기값(0)이면 실행 안 함
    if (!email || statsTrigger === 0) return;
    // 직전과 같은 트리거면 중복 조회 방지
    if (statsTrigger === prevTriggerRef.current) return;

    // 현재 trigger 값을 ref에 저장
    prevTriggerRef.current = statsTrigger;

    // Noe.js 백엔드로 통계 조회 요청 후 total, todayCount, toneStats 상태 업데이트
    // 백엔드 서버 엔드포인트: port 3000의 /api/stats?email=${email}
    // // useEffect 콜백은 async 불가 → .then() 체이닝 방식으로 호출
    fetch(`http://localhost:3000/api/stats?email=${email}`)
      .then(res => res.json())
      .then(data => {  // 백엔드가 res.json()으로 보낸 객체를 data로 받음
        setTotal(data.total);  // 총 변환 횟수
        setTodayCount(data.todayCount);  // 오늘 변환 횟수
        setToneStats(data.toneStats);  // 톤별 사용 횟수 배열 (tone, count)
      })
      .catch(err => console.error('⚠️ 통계 조회 실패:', err));
  }, [statsTrigger]);

  // 빈 상태 (통계 없을 때)
  if (total === 0) {
    return (
      <div className="w-52 flex-shrink-0 self-stretch rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 p-5 text-center">
        <BarChart2 size={22} className="text-gray-300" />
        <p className="text-xs text-gray-400 leading-relaxed">
          변환 후<br />사용 패턴이<br />여기에 표시돼요
        </p>
      </div>
    );
  }

  // 통계 있을 때
  return (
    <div className="w-52 flex-shrink-0 self-stretch rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col gap-3">

      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <BarChart2 size={13} className="text-blue-500" />
        <span className="text-xs font-semibold text-blue-600">내 사용 패턴</span>
      </div>

      {/* 요약 수치 — 3칸 가로 한 줄 */}
      <div className="flex gap-2">

        {/* 총 변환 */}
        <div className="flex-1 bg-white rounded-xl py-2 text-center shadow-sm">
          <p className="text-base font-bold text-rose-500 leading-none">{total}</p>
          <p className="text-[10px] text-rose-500 mt-1">총 변환</p>
        </div>

        {/* 오늘 */}
        <div className="flex-1 bg-white rounded-xl py-2 text-center shadow-sm">
          <p className="text-base font-bold text-amber-500 leading-none">{todayCount}</p>
          <p className="text-[10px] text-amber-500 mt-1">오늘</p>
        </div>

        {/* 자주 쓰는 톤 */}
        {topTone && TONE_META[topTone.tone] && (
          <div className="flex-1 bg-white rounded-xl py-2 text-center shadow-sm">
            <p className="text-base leading-none">{TONE_META[topTone.tone].emoji}</p>
            <p className={`text-[10px] mt-1 ${TEXT_COLORS[TONE_META[topTone.tone].color]}`}>자주 사용</p>
          </div>
        )}

      </div>

      {/* 구분선 */}
      <div className="border-t border-blue-100" />

      {/* 톤별 비율 — flex-1로 남은 공간 균등 채움 */}
      <div className="flex flex-col flex-1">

        <div className="flex items-center gap-1 mb-2">
          <TrendingUp size={11} className="text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-400">톤별 비율</span>
        </div>

        {/* 5개 톤 전부 표시, justify-between으로 균등 배분 */}
        <div className="flex flex-col justify-between flex-1">
          {Object.entries(TONE_META).map(([tone, meta]) => {
            // toneStats 배열에서 현재 톤과 일치하는 항목 찾기
            const stat = toneStats.find(s => s.tone === tone);
            const count = stat?.count ?? 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const barColor = BAR_COLORS[meta.color] || 'bg-blue-400';

            return (
              <div key={tone} className="flex flex-col gap-0.5">

                {/* 톤 이름 + 퍼센트 */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    {meta.emoji} {meta.name}
                  </span>
                  <span className={`text-[10px] font-medium ${percent > 0 ? 'text-gray-600' : 'text-gray-300'}`}>
                    {percent}%
                  </span>
                </div>

                {/* 비율 바 */}
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${percent > 0 ? barColor : 'bg-gray-100'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default StatsDashboard;