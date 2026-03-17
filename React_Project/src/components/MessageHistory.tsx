import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronUp, ChevronDown, Sparkles, Clock } from 'lucide-react';

// 히스토리 아이템 타입
export type HistoryItem = {
  id: number;
  tone: string;
  toneEmoji: string;
  toneColor: string;
  toneName: string;
  subject: string;
  message: string;
  createdAt: Date;
};

// MessageHistory 컴포넌트가 부모(MessageCompose)로부터 받을 props 타입 정의
// props: 부모 컴포넌트가 자식 컴포넌트에게 데이터를 전달하는 방법
type MessageHistoryProps = {
  history: HistoryItem[];  // 히스토리 아이템 배열
  onSelect: (item: HistoryItem) => void;  // 카드 클릭 시 실행될 함수, 클릭한 카드의 HistoryItem 객체를 인자로 받음
  currentId?: number | null;  // 현재 선택된 히스토리 아이템의 id
};

// 시간 포맷 함수
const formatTime = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

// 톤 색상 클래스 반환
const getToneColorClasses = (color: string) => {
  // Record는 key와 value의 타입을 지정해주는 TS 타입
  // key는 string, value는 { badge: string, border: string } 객체인 딕셔너리
  const map: Record<string, { badge: string; border: string }> = {
    blue:    { badge: 'bg-blue-50 text-blue-700 border-blue-200',    border: 'border-blue-400' },
    slate:   { badge: 'bg-slate-50 text-slate-700 border-slate-200', border: 'border-slate-400' },
    emerald: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-400' },
    orange:  { badge: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-orange-400' },
    purple:  { badge: 'bg-purple-50 text-purple-700 border-purple-200', border: 'border-purple-400' },
  };
  return map[color] || map.blue;
};

// 부모(MessageCompose)로부터 history(히스토리 배열), onSelect(카드 클릭 시 실행할 함수), currentId(현재 선택된 카드 id)를 props로 받음
const MessageHistory = ({ history, onSelect, currentId }: MessageHistoryProps) => {
  // 히스토리가 쌓이면 자동으로 열림, 없으면 헤더만 보임
  const [isOpen, setIsOpen] = useState(history.length > 0);

  // 새 히스토리가 추가될 때마다 자동으로 열기
  useEffect(() => {
    if (history.length > 0) setIsOpen(true);
  }, [history.length]);

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* 드로어 헤더 (열기/닫기 토글) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">변환 히스토리</span>
          {/* 히스토리 개수 뱃지 */}
          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>{isOpen ? '접기' : '펼치기'}</span>
          {isOpen
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </button>

      {/* 드로어 바디 */}
      <AnimatePresence>
        {isOpen && (  // isOpen이 true일 때만 렌더링
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* 가로 스크롤 카드 목록 */}
            <div className="flex gap-3 overflow-x-auto px-6 py-4 scrollbar-hide">
              {/* map으로 순회할 때 각 카드의 HistoryItem 객체가 item이 됨 */}
              {history.map((item) => {
                // history 배열의 각 item의 toneColor(blue, slate 등)를 getToneColorClasses에 전달해서 색상 클래스를 반환받음
                const colors = getToneColorClasses(item.toneColor);
                // currentId(현재 선택된 카드 id)와 item.id(순회 중인 카드 id)가 같으면 isSelected = true, 다르면 false
                const isSelected = currentId === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onSelect(item)}  // 클릭한 카드의 item을 부모로 전달
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={`
                      flex-shrink-0 w-53 text-left rounded-xl border-2 p-4
                      transition-all duration-200 bg-white
                      ${isSelected
                        ? `${colors.border} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* 톤 뱃지 + 시간 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}>
                        <span>{item.toneEmoji}</span>
                        <span>{item.toneName}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Clock size={10} />
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    {/* 변환된 제목 */}
                    <p className="text-xs font-semibold text-gray-800 mb-1 line-clamp-1">
                      {item.subject}
                    </p>

                    {/* 변환된 본문 미리보기 */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* 선택됨 표시 */}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1">
                        <Sparkles size={10} className="text-blue-500" />
                        <span className="text-xs text-blue-500 font-medium">현재 선택됨</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageHistory;