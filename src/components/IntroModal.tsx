import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Check, FastForward, Sparkles, HelpCircle, Music, Volume2, VolumeX, Upload } from 'lucide-react';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onRequestExit?: () => void;
}

// Global BGM Audio instance
let bgmAudioInstance: HTMLAudioElement | null = null;

function startIntroBGM() {
  try {
    const targetUrl = '/bgm.mp3';
    if (!bgmAudioInstance) {
      bgmAudioInstance = new Audio(targetUrl);
      bgmAudioInstance.loop = true;
      bgmAudioInstance.volume = 0.5;
    } else {
      bgmAudioInstance.pause();
      bgmAudioInstance.currentTime = 0;
    }

    const promise = bgmAudioInstance.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay may be blocked until user clicks
      });
    }
  } catch {
    // Ignore audio policy errors
  }
}

function stopIntroBGM() {
  if (bgmAudioInstance) {
    try {
      bgmAudioInstance.pause();
      bgmAudioInstance.currentTime = 0;
    } catch {
      // Ignore
    }
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// 1. Play crisp retro typewriter key tick sound
function playTypewriterTick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Crisp retro mechanical key tick with frequency sweep
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 300, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);
    
    // Volume level increased to 0.15 so it is clearly audible over BGM
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Ignore audio errors
  }
}

// 2. Play retro button click sound
function playButtonClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(960, now + 0.06);
    
    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Ignore audio errors
  }
}

// 3. Play stage transition sound
function playTransitionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Ignore audio errors
  }
}

// 4. Play answer reveal success chime
function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  } catch {
    // Ignore audio errors
  }
}

// 퀴즈 데이터 정의
const QUIZ_STEPS = [
  {
    chapter: "Chapter 1 : 민주주의와 시민 참여",
    question: "국민이 권리를 행사하고 대표를 뽑는 정치 형태는 무엇인가요?",
    answer: "민주주의",
    bgPattern: "from-amber-950/80 via-black to-amber-950/90",
    icon: "🏛️"
  },
  {
    chapter: "Chapter 2 : 민주주의와 선거",
    question: "모든 국민이 직접 나라 살림을 운영하기는 어렵습니다. 따라서 국민이 자신들을 대표할 사람을 투표로 뽑는데 이것을 무엇이라고 할까요?",
    answer: "선거",
    bgPattern: "from-blue-950/80 via-black to-slate-950/90",
    icon: "🗳️"
  },
  {
    chapter: "Chapter 3 : 선거의 중요성",
    question: "국민이 적극적으로 선거에 참여하면 선거의 결과와 정치가 달라질 수 있다. (O, X)",
    answer: "O",
    bgPattern: "from-emerald-950/80 via-black to-teal-950/90",
    icon: "✨"
  },
  {
    chapter: "Chapter 4 : 공약 검토",
    question: "선거 공약을 검토할 때 공약이 구체적인지와 함께 누구의 요구를 반영하는지 확인해야 할까요?",
    answer: "국민의 요구",
    bgPattern: "from-purple-950/80 via-black to-indigo-950/90",
    icon: "📜"
  },
];

// 아웃트로 RPG 대화 데이터
const RPG_DIALOGUES = [
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "자네.. 이 책을 다 읽은건가?" },
  { speaker: 'student', name: '학생', portrait: '🧒', text: "네. 그런데 누구시죠?" },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "후훗.. 이 책을 다 읽을 정도라면.." },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "혹시 재미있는 게임이 있는데 한 번 참여해 보겠나?" },
  { speaker: 'student', name: '학생', portrait: '🧒', text: "게임..이요?" },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "뭐 간단한 사회 게임이라고 생각하면 돼." },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "자신의 정체를 숨기고 상대의 정체를 파악하는" },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "민주주의적 의사결정 과정과 선거를 통한 올바른 대표 선출의 중요성을 체험할 수 있는 게임이지.." },
  { speaker: 'student', name: '학생', portrait: '🧒', text: "좋아요!!" },
  { speaker: 'elder', name: '의문의 노인', portrait: '👴', text: "자! 나를 따라오게." },
  { speaker: 'system', name: '게임 시스템', portrait: '⚖️', text: "자.. 그럼 게임을 시작하겠습니다." }
];

export default function IntroModal({ isOpen, onClose, onComplete, onRequestExit }: IntroModalProps) {
  // 모드: 'scroll' (오프닝 스크롤) -> 'quiz' (1~4단계) -> 'rpg' (아웃트로 대화)
  const [phase, setPhase] = useState<'scroll' | 'quiz' | 'rpg'>('scroll');
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState('');
  
  // BGM 음소거 상태
  const [isMuted, setIsMuted] = useState(false);

  // 타자기(Typewriter) 효과용 상태
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // RPG 대화 단계
  const [dialogueIdx, setDialogueIdx] = useState(0);

  const toggleMute = () => {
    if (bgmAudioInstance) {
      bgmAudioInstance.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 모달이 열릴 때 상태 및 BGM 처리
  useEffect(() => {
    if (isOpen) {
      setPhase('scroll');
      setCurrentQuizIdx(0);
      setShowAnswer(false);
      setRevealedAnswer('');
      setTypedText('');
      setIsTyping(false);
      setDialogueIdx(0);
      startIntroBGM();
    } else {
      stopIntroBGM();
    }

    return () => {
      stopIntroBGM();
    };
  }, [isOpen]);

  // Quiz 단계 진입 시 타자기 효과 & 효과음
  useEffect(() => {
    if (phase === 'quiz') {
      setShowAnswer(false);
      setRevealedAnswer('');
      const targetText = QUIZ_STEPS[currentQuizIdx].question;
      setTypedText('');
      setIsTyping(true);

      let i = 0;
      const timer = setInterval(() => {
        if (i < targetText.length) {
          setTypedText(targetText.slice(0, i + 1));
          playTypewriterTick();
          i++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [phase, currentQuizIdx]);

  // RPG 대화 타자기 효과 & 효과음
  useEffect(() => {
    if (phase === 'rpg') {
      const targetText = RPG_DIALOGUES[dialogueIdx].text;
      setTypedText('');
      setIsTyping(true);

      let i = 0;
      const timer = setInterval(() => {
        if (i < targetText.length) {
          setTypedText(targetText.slice(0, i + 1));
          playTypewriterTick();
          i++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 25);

      return () => clearInterval(timer);
    }
  }, [phase, dialogueIdx]);

  if (!isOpen) return null;

  const handleFinishAndClose = () => {
    playButtonClickSound();
    stopIntroBGM();
    onComplete();
  };

  // 타자기 텍스트 전체 즉시 완료
  const handleFastForwardText = () => {
    getAudioContext()?.resume();
    playButtonClickSound();
    if (phase === 'quiz') {
      setTypedText(QUIZ_STEPS[currentQuizIdx].question);
      setIsTyping(false);
    } else if (phase === 'rpg') {
      setTypedText(RPG_DIALOGUES[dialogueIdx].text);
      setIsTyping(false);
    }
  };

  // Quiz 정답 확인
  const handleConfirmAnswer = () => {
    getAudioContext()?.resume();
    setRevealedAnswer(QUIZ_STEPS[currentQuizIdx].answer);
    setShowAnswer(true);
    playSuccessChime();
  };

  // 다음 퀴즈 또는 RPG로 이동
  const handleNextQuiz = () => {
    getAudioContext()?.resume();
    playTransitionSound();
    setShowAnswer(false);
    setRevealedAnswer('');
    setTypedText('');
    setIsTyping(true);

    if (currentQuizIdx < QUIZ_STEPS.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setPhase('rpg');
      setDialogueIdx(0);
    }
  };

  // RPG 대화 다음 버튼
  const handleNextDialogue = () => {
    getAudioContext()?.resume();
    if (isTyping) {
      handleFastForwardText();
      return;
    }

    playButtonClickSound();
    if (dialogueIdx < RPG_DIALOGUES.length - 1) {
      setDialogueIdx(prev => prev + 1);
    } else {
      // 아웃트로 끝 -> 게임 시작!
      handleFinishAndClose();
    }
  };

  return (
    <div
      onPointerDown={() => getAudioContext()?.resume()}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md font-sans select-none overflow-hidden"
    >
      
      {/* Background Pixel/Retro Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1d2d_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Top Bar: Mute Control & Skip Intro Button */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="p-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-full text-xs transition flex items-center justify-center shadow-lg cursor-pointer"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={handleFinishAndClose}
          className="px-3.5 py-1.5 bg-gray-900/80 hover:bg-gold-950 border border-gray-700 hover:border-gold-500/50 text-gray-300 hover:text-gold-400 rounded-full text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <FastForward className="w-3.5 h-3.5" /> 건너뛰기 (SKIP)
        </button>
      </div>

      {/* Outer Retro CRT/Game Frame */}
      <div className="w-full max-w-4xl h-[90vh] max-h-[720px] bg-[#0c0d12] border-4 border-[#3a2d1d] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col justify-between overflow-hidden relative">

        {/* Outer Frame Top Bar Decorative Accent */}
        <div className="bg-[#1a140d] border-b-2 border-[#3a2d1d] px-4 py-2 flex items-center justify-between text-gold-500 text-xs font-mono font-bold tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            <span className="ml-2 text-gold-400 uppercase">THE GENIUS CLASSROOM INTRO STORY</span>
          </div>
          <div className="hidden sm:block text-gray-500 text-[10px]">RETRO RPG STORY MODE</div>
        </div>

        {/* Main Content View Switcher */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">

          {/* ======================================================== */}
          {/* PHASE 0: OPENING CRAWL / SCROLL TEXT MODE */}
          {/* ======================================================== */}
          {phase === 'scroll' && (
            <div className="w-full h-full flex flex-col items-center justify-between relative py-6">
              
              <div className="text-center space-y-1 z-10 bg-black/60 px-4 py-2 rounded-full border border-gold-900/40">
                <span className="text-xs font-mono tracking-widest text-gold-400 uppercase font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" /> INTRO STORY CRAWL
                </span>
              </div>

              {/* Crawling Text Container starting from the very bottom */}
              <div className="w-full max-w-2xl flex-1 relative overflow-hidden my-2 flex items-center justify-center">
                <motion.div
                  initial={{ y: 550 }}
                  animate={{ y: -580 }}
                  transition={{ duration: 18, ease: 'linear' }}
                  className="space-y-6 text-center text-gray-200 font-bold leading-relaxed tracking-wide px-4"
                >
                  <p className="text-gold-400 text-xl sm:text-3xl font-black font-display">" 더 재미있는 사회 시간 "</p>
                  <p className="text-gold-300 text-2xl sm:text-4xl font-black font-display">민주주의와 시민 참여</p>
                  <div className="py-2 text-lg sm:text-2xl space-y-4 text-gray-200 font-sans">
                    <p>학교에서 분명히 민주주의에서 선거와 투표의</p>
                    <p>중요성에 대해서 배웠는데...</p>
                    <p className="text-gold-400/90 italic font-display">"아.. 그런데 기억이 잘 안나네"</p>
                    <p className="text-amber-300 font-black text-2xl pt-2">"잠깐.. 이게 뭐지?"</p>
                  </div>

                  {/* Book Icon Rising */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1.2, rotate: 0 }}
                    transition={{ delay: 3, duration: 0.8, type: 'spring' }}
                    className="py-4 flex flex-col items-center justify-center gap-3 bg-gold-950/60 border-2 border-gold-500/70 rounded-2xl p-6 shadow-2xl backdrop-blur-sm max-w-md mx-auto"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-600 to-amber-300 flex items-center justify-center shadow-lg text-black text-3xl">
                      📖
                    </div>
                    <p className="text-gold-300 text-xl font-black leading-snug font-display">
                      민주주의와 선거? 시민 참여?<br />
                      <span className="text-white text-lg font-bold">한 번 읽어볼까?</span>
                    </p>
                  </motion.div>
                </motion.div>
              </div>

              {/* Bottom Action Button for Scroll - Blinking and Glowing */}
              <div className="z-20 pt-2">
                <button
                  onClick={() => {
                    getAudioContext()?.resume();
                    playTransitionSound();
                    setPhase('quiz');
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-gold-500 via-yellow-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-extrabold text-base sm:text-lg rounded-2xl shadow-2xl shadow-gold-500/40 transition hover:scale-105 flex items-center gap-2 cursor-pointer border-2 border-gold-200 ring-4 ring-gold-400/60 animate-pulse"
                >
                  <BookOpen className="w-6 h-6 fill-black" />
                  책 펼쳐보기 (1단계 시작) <ChevronRight className="w-6 h-6" />
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 1 ~ 4: QUIZ STAGES MODE */}
          {/* ======================================================== */}
          {phase === 'quiz' && (
            <div className={`w-full h-full flex flex-col justify-between p-4 sm:p-6 rounded-xl bg-gradient-to-b ${QUIZ_STEPS[currentQuizIdx].bgPattern} transition-all duration-700 relative`}>
              
              {/* Stage Progress Bar Header */}
              <div className="flex items-center justify-between border-b border-gold-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{QUIZ_STEPS[currentQuizIdx].icon}</span>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gold-500 tracking-widest block uppercase">QUIZ STAGE {currentQuizIdx + 1} / {QUIZ_STEPS.length}</span>
                    <h3 className="text-lg sm:text-2xl font-black text-white font-display">{QUIZ_STEPS[currentQuizIdx].chapter}</h3>
                  </div>
                </div>

                {/* Step Indicator Badges */}
                <div className="flex items-center gap-1.5">
                  {QUIZ_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        idx === currentQuizIdx
                          ? 'bg-gold-400 border-gold-300 scale-125 shadow-[0_0_8px_rgba(212,175,55,0.8)]'
                          : idx < currentQuizIdx
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Main Quiz Box & Typewriter Text with Main Game Font */}
              <div className="flex-1 my-4 flex flex-col justify-center items-center relative overflow-hidden px-2">
                
                {/* Question Box Frame */}
                <div
                  onClick={isTyping ? handleFastForwardText : undefined}
                  className="w-full max-w-2xl bg-[#0a0b10]/95 border-2 border-gold-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 relative cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-gold-400/80 border-b border-gray-800 pb-2">
                    <span className="flex items-center gap-1.5 font-bold"><HelpCircle className="w-4 h-4 text-gold-400" /> 질문 문제</span>
                    <span className="text-[10px] text-gray-500">{isTyping ? '⚡ 클릭하면 전체 텍스트 표시' : '✓ 텍스트 출력 완료'}</span>
                  </div>

                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-relaxed min-h-[110px] font-sans tracking-tight">
                    {typedText}
                    {isTyping && <span className="inline-block w-3 h-7 bg-gold-400 ml-1.5 animate-pulse" />}
                  </p>
                </div>

                {/* Answer Overlay Card (Without quotes, using main game font) */}
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-2 border-gold-400 shadow-[0_0_50px_rgba(212,175,55,0.5)]"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-3xl shadow-lg"
                      >
                        ✓
                      </motion.div>

                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold-400">정답 공개</span>
                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-yellow-300 drop-shadow-md font-display tracking-tight">
                          {revealedAnswer || QUIZ_STEPS[currentQuizIdx].answer}
                        </h2>
                      </div>

                      <p className="text-sm sm:text-base text-gray-200 max-w-md font-bold">
                        훌륭합니다! 정답을 맞혀 민주주의 지식을 습득하셨습니다.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Bottom Buttons */}
              <div className="flex justify-center items-center pt-2">
                {!showAnswer ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={isTyping}
                    className={`px-8 py-3.5 rounded-xl text-base font-extrabold tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg ${
                      isTyping
                        ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                        : 'bg-gold-500 hover:bg-gold-400 text-black border border-gold-300 shadow-gold-500/20 hover:scale-105'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    확인 (정답 보기)
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-base rounded-xl shadow-xl shadow-emerald-500/20 transition hover:scale-105 flex items-center gap-2 cursor-pointer z-40"
                  >
                    {currentQuizIdx < QUIZ_STEPS.length - 1 ? (
                      <>다음 단계로 이동 <ChevronRight className="w-5 h-5" /></>
                    ) : (
                      <>다음 <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PHASE 5: RPG DIALOGUE OUTRO MODE */}
          {/* ======================================================== */}
          {phase === 'rpg' && (
            <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-stone-950 via-black to-stone-900 rounded-xl relative overflow-hidden">
              
              {/* Header Label */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> RETRO RPG DIALOGUE STORY
                </span>
                <span className="text-[11px] font-mono text-stone-500">대화 {dialogueIdx + 1} / {RPG_DIALOGUES.length}</span>
              </div>

              {/* Main RPG Visual & Dialogue Scene */}
              <div className="flex-1 my-3 flex flex-col items-center justify-end relative space-y-4">
                
                {/* Pixel Character Portraits Display Area */}
                <div className="w-full flex justify-around items-end px-6 pb-2">
                  
                  {/* Elder NPC Avatar */}
                  <div className={`flex flex-col items-center transition-all duration-300 ${
                    RPG_DIALOGUES[dialogueIdx].speaker === 'elder' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 blur-[0.5px]'
                  }`}>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shadow-amber-900/50">
                      👴
                    </div>
                    <span className="text-xs font-bold text-amber-400 mt-2 bg-black/80 px-2.5 py-0.5 rounded border border-amber-900">
                      의문의 노인
                    </span>
                  </div>

                  {/* Student Avatar */}
                  <div className={`flex flex-col items-center transition-all duration-300 ${
                    RPG_DIALOGUES[dialogueIdx].speaker === 'student' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 blur-[0.5px]'
                  }`}>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-950/80 border-2 border-blue-500/70 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shadow-blue-900/50">
                      🧒
                    </div>
                    <span className="text-xs font-bold text-blue-400 mt-2 bg-black/80 px-2.5 py-0.5 rounded border border-blue-900">
                      학생
                    </span>
                  </div>

                </div>

                {/* Classic Pixel RPG Dialogue Box */}
                <div
                  onClick={handleNextDialogue}
                  className={`w-full max-w-2xl bg-[#0f0c09] border-4 ${
                    RPG_DIALOGUES[dialogueIdx].speaker === 'elder' ? 'border-amber-600' :
                    RPG_DIALOGUES[dialogueIdx].speaker === 'student' ? 'border-blue-600' :
                    'border-gold-500'
                  } rounded-2xl p-5 sm:p-6 shadow-2xl space-y-2 cursor-pointer relative group`}
                >
                  {/* Speaker Label Bar */}
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <span className={`text-xs font-extrabold uppercase font-mono px-2 py-0.5 rounded ${
                      RPG_DIALOGUES[dialogueIdx].speaker === 'elder' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      RPG_DIALOGUES[dialogueIdx].speaker === 'student' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                      'bg-gold-950 text-gold-300 border border-gold-700'
                    }`}>
                      {RPG_DIALOGUES[dialogueIdx].portrait} {RPG_DIALOGUES[dialogueIdx].name}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">클릭하여 계속 진행 ▶</span>
                  </div>

                  {/* Dialogue Content with Typewriter */}
                  <p className="text-lg sm:text-2xl font-black text-stone-100 min-h-[60px] leading-relaxed font-sans tracking-tight pt-1">
                    {typedText}
                    {isTyping && <span className="inline-block w-2.5 h-6 bg-amber-400 ml-1.5 animate-pulse" />}
                  </p>

                  <div className="absolute bottom-2 right-3 text-stone-500 group-hover:text-amber-400 text-xs animate-bounce font-mono">
                    ▼
                  </div>
                </div>

              </div>

              {/* Bottom Dialogue Controller Button */}
              <div className="flex justify-center items-center pt-2">
                <button
                  onClick={handleNextDialogue}
                  className={`px-8 py-3.5 rounded-xl text-base font-extrabold tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xl ${
                    dialogueIdx === RPG_DIALOGUES.length - 1
                      ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-gold-500 text-black border-2 border-gold-300 ring-4 ring-gold-400/50 animate-bounce'
                      : 'bg-amber-600 hover:bg-amber-500 text-black border border-amber-400'
                  }`}
                >
                  {dialogueIdx === RPG_DIALOGUES.length - 1 ? (
                    <>⚔️ 배심원 게임 시작하기!</>
                  ) : (
                    <>다음 대화 (클릭) ▶</>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

