import React, { useState } from 'react';
import { Users, UserPlus, Play } from 'lucide-react';

interface SetupViewProps {
  onStartGame: (playerNames: string[]) => void;
}

export const ROLE_COUNTS: { [key: number]: { citizen: number; criminal: number } } = {
  5: { citizen: 3, criminal: 2 },
  6: { citizen: 4, criminal: 2 },
  7: { citizen: 4, criminal: 3 },
  8: { citizen: 5, criminal: 3 },
  9: { citizen: 5, criminal: 4 },
  10: { citizen: 6, criminal: 4 },
  11: { citizen: 7, criminal: 4 },
  12: { citizen: 7, criminal: 5 }, // Standard
  13: { citizen: 8, criminal: 5 },
  14: { citizen: 8, criminal: 6 },
  15: { citizen: 9, criminal: 6 }
};

export default function SetupView({ onStartGame }: SetupViewProps) {
  const [playerCount, setPlayerCount] = useState<number>(12);
  const [namesText, setNamesText] = useState<string>(() => {
    return Array.from({ length: 12 }, (_, i) => `학생 ${i + 1}`).join('\n');
  });

  const handleSliderChange = (count: number) => {
    setPlayerCount(count);
    
    // Parse current lines
    const currentLines = namesText.split('\n');
    let updatedNames = [...currentLines];
    
    if (updatedNames.length < count) {
      const diff = count - updatedNames.length;
      for (let i = 0; i < diff; i++) {
        // Add default placeholders based on total size to keep it unique
        updatedNames.push(`학생 ${updatedNames.length + 1}`);
      }
    } else if (updatedNames.length > count) {
      updatedNames = updatedNames.slice(0, count);
    }
    
    setNamesText(updatedNames.join('\n'));
  };

  const handleTextareaChange = (text: string) => {
    setNamesText(text);
    
    // Dynamic recognition of players based on non-empty lines
    const parsedNames = text.split('\n').map(n => n.trim()).filter(n => n !== '');
    const count = parsedNames.length;
    
    if (count >= 5 && count <= 15) {
      setPlayerCount(count);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedNames = namesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    
    if (parsedNames.length < 5 || parsedNames.length > 15) {
      alert(`참가 학생 수는 5명에서 15명 사이여야 합니다. 현재 입력된 학생 수: ${parsedNames.length}명`);
      return;
    }
    
    // Check for duplicates
    const duplicates = parsedNames.filter((item, index) => parsedNames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      alert(`중복된 이름이 있습니다: "${duplicates[0]}". 모든 학생의 이름은 서로 다르게 입력해 주세요.`);
      return;
    }
    
    onStartGame(parsedNames);
  };

  const currentDistribution = ROLE_COUNTS[playerCount] || { citizen: 0, criminal: 0 };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-widest text-gold-400 uppercase drop-shadow-lg mb-2">
          배심원 게임
        </h1>
        <p className="text-xs sm:text-sm font-mono tracking-widest text-gold-600 uppercase">
          The Genius Classroom Support Tool
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch w-full">
        {/* Settings Column */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="bg-[#0f111a] border border-gold-900/40 rounded-xl p-5 shadow-xl h-full flex flex-col justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-gold-400 mb-6 flex items-center gap-2 border-b border-gold-900/30 pb-2">
                <Users className="w-4 h-4 text-gold-500" /> 게임 설정 (Setup)
              </h3>

              {/* Player Count Selection (Slider Bar) */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400 block font-semibold">참가 학생 수 선택</label>
                  <span className="text-xs font-bold font-mono bg-gold-950/60 text-gold-400 border border-gold-900/40 px-2.5 py-1 rounded">
                    {playerCount}명
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    id="player-count-slider"
                    type="range"
                    min="5"
                    max="15"
                    step="1"
                    value={playerCount}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                    className="w-full accent-gold-500 bg-black/50 border border-gray-800 rounded-lg h-2 appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono px-1">
                    <span>5명</span>
                    <span>7명</span>
                    <span>9명</span>
                    <span>11명</span>
                    <span>13명</span>
                    <span>15명</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Distribution Summary Card */}
            <div className="bg-black/40 border border-gold-950 rounded-lg p-4 space-y-3 mt-4">
              <h4 className="text-xs font-bold font-mono uppercase text-gold-500 tracking-wider">
                팀 및 리더 자동 배치 정보
              </h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gold-950/20 border border-gold-800/20 p-2.5 rounded">
                  <p className="text-[10px] text-gold-500 uppercase font-mono">시민 팀</p>
                  <p className="text-xl font-display font-black text-gold-300">
                    {currentDistribution.citizen}명
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">리더 1명 포함</p>
                </div>
                <div className="bg-crimson-950/20 border border-crimson-800/20 p-2.5 rounded">
                  <p className="text-[10px] text-crimson-400 uppercase font-mono">범죄자 팀</p>
                  <p className="text-xl font-display font-black text-crimson-400">
                    {currentDistribution.criminal}명
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">리더 1명 포함</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 leading-normal">
                💡 <span className="text-gold-400 font-semibold">시민 리더</span>는 범죄자 리더를 제외한 일반 범죄자들의 정체를 감지하고, <span className="text-crimson-400 font-semibold">범죄자</span>들은 동료 범죄자들의 정체를 모두 알고 시작합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Input List Column */}
        <form onSubmit={handleSubmit} className="md:col-span-7 bg-[#0f111a] border border-gold-900/40 rounded-xl p-5 shadow-xl flex flex-col h-full justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-gold-400 mb-4 flex items-center justify-between border-b border-gold-900/30 pb-2">
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gold-500" /> 학생 이름 입력
              </span>
              <span className="text-xs font-mono text-gray-500">PROCTOR DATABASE</span>
            </h3>

            <div className="flex flex-col mb-4">
              <label className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                * 학생 이름을 줄바꿈(엔터)으로 구분하여 입력해 주세요. 입력에 따라 참가 학생 수가 실시간 자동 조정됩니다.
              </label>
              <textarea
                id="player-names-textarea"
                value={namesText}
                onChange={(e) => handleTextareaChange(e.target.value)}
                placeholder="예시)&#10;홍길동&#10;이순신&#10;세종대왕"
                rows={10}
                className="w-full bg-black/40 border border-gray-800 focus:border-gold-500/50 rounded-lg p-3 text-sm text-gray-100 font-medium placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gold-500/30 font-sans leading-relaxed resize-none h-[220px]"
              />
            </div>

            <div className="flex justify-between items-center mb-6 px-1 text-xs">
              <span className="text-gray-400">
                현재 줄 수: <strong className="text-white">{namesText.split('\n').length}줄</strong>
              </span>
              <span className="text-gray-400">
                유효 인식 학생 수: <strong className="text-gold-400 font-bold">{namesText.split('\n').map(n => n.trim()).filter(n => n !== '').length}명</strong>
              </span>
            </div>
          </div>

          <button
            id="start-game-submit-btn"
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-gold-700 via-gold-500 to-gold-700 hover:from-gold-600 hover:to-gold-600 text-black font-extrabold text-sm rounded-lg transition-all duration-300 shadow-xl shadow-gold-950/30 flex items-center justify-center gap-2 uppercase tracking-widest font-display cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black text-black" /> 게임 시작
          </button>
        </form>
      </div>

      {/* Footer Area with Copyright Contact Info */}
      <div className="w-full text-center mt-12 pt-6 border-t border-gold-950/10 text-gray-500 text-[11px] tracking-wider space-y-1 z-10">
        <p className="text-gray-400">제안이나 문의사항이 있으시면 언제든 메일 주세요.</p>
        <p className="font-mono text-gold-500/60">
          Contact: <a href="mailto:sinjoppo@naver.com" className="hover:text-gold-400 underline transition">sinjoppo@naver.com</a>
        </p>
        <p className="text-[10px] font-mono mt-1 text-gray-600">
          ⓒ 2026. Kwon's class. All rights reserved.
        </p>
      </div>
    </div>
  );
}
