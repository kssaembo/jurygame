import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Shield, Award, EyeOff, CheckCircle2 } from 'lucide-react';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "배심원 게임이란?",
      subtitle: "The Genius - Jury Game Rules",
      icon: <BookOpen className="w-12 h-12 text-gold-400" />,
      content: (
        <div className="space-y-4 text-gray-300">
          <p className="leading-relaxed">
            배심원 게임은 <span className="text-gold-400 font-bold">시민 팀</span>과 <span className="text-crimson-400 font-bold">범죄자 팀</span>으로 나뉘어 벌이는 심리 추리 게임입니다.
          </p>
          <div className="bg-amber-950/20 border border-gold-900/30 p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-gold-300 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-400" /> 승리 조건
            </h4>
            <p className="text-sm">
              총 <span className="text-white font-bold">5번의 재판</span>이 열립니다.
            </p>
            <ul className="list-disc list-inside text-sm pl-2 space-y-1">
              <li><span className="text-gold-400 font-bold">시민 팀</span>: 3번 이상 <span className="text-green-400 font-semibold">유죄 판결</span>을 이끌어내면 승리!</li>
              <li><span className="text-crimson-400 font-bold">범죄자 팀</span>: 3번 이상 <span className="text-red-400 font-semibold">무죄 판결</span>을 이끌어내면 승리!</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 italic">
            * 3승을 거둔 즉시 재판이 종료되지만, 패배한 팀의 리더가 상대 팀 리더의 정체를 저격하여 맞추면 단번에 역전할 수 있는 기회가 제공됩니다.
          </p>
        </div>
      ),
    },
    {
      title: "팀 구성 및 특수 직업",
      subtitle: "Roles and Secrets",
      icon: <Shield className="w-12 h-12 text-crimson-400" />,
      content: (
        <div className="space-y-4 text-gray-300">
          <p className="text-sm">
            플레이어 수에 따라 시민 팀과 범죄자 팀의 비율이 자동 조정됩니다.<br />(기본 12명 기준: 시민 7, 범죄자 5)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gold-950/20 border border-gold-500/20 p-3 rounded-lg">
              <h5 className="font-bold text-gold-400 text-sm mb-1">시민 팀 (시민 + 리더)</h5>
              <ul className="text-xs space-y-1 text-gray-300 list-disc list-inside">
                <li><span className="text-white font-semibold">일반 시민</span>: 정보가 전혀 없습니다.</li>
                <li><span className="text-gold-300 font-bold">시민 리더</span>: 범죄자 리더를 <span className="text-crimson-400">제외한</span> 일반 범죄자들의 명단을 미리 감지합니다.</li>
              </ul>
            </div>
            <div className="bg-crimson-950/20 border border-crimson-500/20 p-3 rounded-lg">
              <h5 className="font-bold text-crimson-400 text-sm mb-1">범죄자 팀 (범죄자 + 리더)</h5>
              <ul className="text-xs space-y-1 text-gray-300 list-disc list-inside">
                <li><span className="text-white font-semibold">일반 범죄자</span>: 동료 범죄자 팀원 전체의 명단을 확인합니다.</li>
                <li><span className="text-crimson-300 font-bold">범죄자 리더</span>: 똑같이 동료 범죄자 명단을 확인하며, 리더 임무를 수행합니다.</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
            🚨 정체 확인 시, 다른 학생들에게 정보가 노출되지 않도록 1명씩 교사용 PC를 확인하게 해주세요.
          </p>
        </div>
      ),
    },
    {
      title: "재판 진행 과정",
      subtitle: "Round Procedure",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-gray-300 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <span className="text-gold-400 font-bold">배심원장 선정</span>: 라운드가 시작되면 랜덤으로 정해진 배심원장 순서에 따라 배심원장이 공개됩니다.
            </li>
            <li>
              <span className="text-gold-400 font-bold">배심원단 지정</span>: 배심원장은 해당 라운드의 규정 인원만큼 배심원을 추천합니다.
            </li>
            <li>
              <span className="text-gold-400 font-bold">찬반 거수 투표</span>: 추천된 배심원단에 대해 교실 전체에서 거수로 찬반 투표를 합니다.
              <ul className="list-disc list-inside pl-4 text-xs text-gray-400">
                <li><span className="text-green-400">과반수 이상 찬성시</span>: 익명 재판(비밀 투표) 단계로 진입</li>
                <li><span className="text-red-400">부결시</span>: 즉시 다음 배심원장에게 권한이 넘어가며, 다시 배심원단을 지정합니다.</li>
              </ul>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: "익명 재판 & 판결 규칙",
      subtitle: "Secret Ballot & Verdict Rules",
      icon: <EyeOff className="w-12 h-12 text-blue-400" />,
      content: (
        <div className="space-y-3 text-gray-300 text-sm">
          <p>
            배심원으로 임명된 학생은 교사용 PC로 한 명씩 나와 <span className="text-gold-400 font-bold">비공개 비밀 투표</span>를 진행합니다.
          </p>
          <div className="bg-black/50 p-3 rounded-lg border border-gold-900/30 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-gold-400">판정 규칙 (익명 투표 결과)</h5>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                시민 팀이 승리하기 위해서는 재판 투표 결과가 <span className="text-green-400 font-bold">만장일치 유죄(Guilty)</span>여야 합니다.
              </li>
              <li>
                배심원단 투표 중 <span className="text-crimson-400 font-bold">단 1표라도 무죄</span>가 나오면 해당 라운드는 범죄자 팀의 승리(무죄)가 됩니다.
              </li>
              <li>
                <span className="text-amber-400 font-bold">단, 4라운드 예외</span>: 4라운드에서는 무죄가 <span className="text-amber-300 font-bold">1표 이하</span>인 경우에도 시민 팀이 유죄 판결로 승리합니다!<br />(2표 이상 무죄여야 범죄자 승리)
              </li>
            </ul>
          </div>
          <p className="text-xs text-gray-400">
            * 각 투표 직후 화면이 가려져 다음 투표자가 이전 표를 볼 수 없도록 완벽하게 보안을 유지합니다.
          </p>
        </div>
      ),
    },
    {
      title: "화면 분리 및 조작 가이드",
      subtitle: "Dual-Screen & Classroom Operation",
      icon: <Award className="w-12 h-12 text-gold-500" />,
      content: (
        <div className="space-y-3 text-gray-300 text-sm">
          <p>
            본 앱은 교실 프로젝터와 컴퓨터가 따로 분리된 환경을 완벽하게 지원합니다.
          </p>
          <div className="space-y-2 bg-amber-950/10 p-3 rounded-lg border border-gold-500/20 text-xs">
            <p className="font-bold text-gold-400">💡 화면 운영 모드 안내</p>
            <ul className="list-disc list-inside pl-1 space-y-2">
              <li>
                <span className="text-white font-bold">화면 분할 모드</span>: 게임을 진행하는 교사 운영 화면은 학생들이 보이지 않게 두고, 게임 진행 화면은 학생들이 볼 수 있도록 TV와 연결된 모니터에 띄워주세요.
              </li>
              <li className="text-[11px] text-gray-400 pt-1 border-t border-gold-950/40 list-none">
                * 우측 하단의 <span className="text-gray-200">관리자 로그</span> 버튼을 누르면 전체 게임 진행 과정 로그를 확인하고 엑셀(CSV) 파일로 내보낼 수 있습니다.
              </li>
            </ul>
          </div>
        </div>
      ),
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div 
        id="instruction-modal"
        className="relative w-full max-w-3xl bg-[#0f1118] border border-gold-600/40 rounded-xl shadow-2xl shadow-gold-950/20 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gold-900/40 bg-black/40">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="font-display text-lg font-bold text-gold-400 tracking-wider">배심원 게임 사용설명서</h3>
              <p className="text-xs text-gray-400">The Genius : Jury Game Manual</p>
            </div>
          </div>
          <button 
            id="close-instruction-btn"
            onClick={onClose} 
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 p-8 overflow-y-auto min-h-[300px] flex flex-col justify-center">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4 p-3 bg-gold-950/40 rounded-full border border-gold-500/20 shadow-inner">
              {slides[currentSlide].icon}
            </div>
            <h4 className="font-display text-2xl font-bold text-white tracking-wide mb-1">
              {slides[currentSlide].title}
            </h4>
            <p className="text-xs text-gold-500/80 font-mono tracking-widest uppercase">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          <div className="max-w-xl mx-auto w-full">
            {slides[currentSlide].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-gold-900/40 bg-black/40 flex items-center justify-between">
          <div className="text-xs text-gray-400 font-mono">
            SLIDE <span className="text-gold-400 font-bold">{currentSlide + 1}</span> / {slides.length}
          </div>

          {/* Dots */}
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                id={`manual-dot-${idx}`}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'bg-gold-500 w-4' : 'bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              id="prev-slide-btn"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 border transition ${
                currentSlide === 0 
                  ? 'border-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'border-gold-800 text-gold-400 hover:bg-gold-950/50 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
            {currentSlide < slides.length - 1 ? (
              <button
                id="next-slide-btn"
                onClick={handleNext}
                className="px-3 py-1.5 rounded text-xs flex items-center gap-1 bg-gold-600 text-black font-semibold hover:bg-gold-500 transition"
              >
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="complete-slide-btn"
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs flex items-center gap-1 bg-green-600 text-white font-semibold hover:bg-green-500 transition"
              >
                완료 <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
