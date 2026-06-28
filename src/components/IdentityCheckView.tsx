import { useState, useEffect } from 'react';
import { Player, Role, GameState } from '../types';
import { Eye, EyeOff, ShieldAlert, Sparkles, Check, CheckCircle2, Clock } from 'lucide-react';

interface IdentityCheckViewProps {
  players: Player[];
  gameState?: GameState;
  onUpdateState?: (newState: GameState | ((prev: GameState) => GameState)) => void;
  onComplete: () => void;
}

export default function IdentityCheckView({ players, gameState, onUpdateState, onComplete }: IdentityCheckViewProps) {
  // Track which player index has checked their role
  const [checkedStatus, setCheckedStatus] = useState<{ [index: number]: boolean }>({});
  const [localActiveCheckIndex, setLocalActiveCheckIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);

  // If gameState has activeCheckIndex, sync it to local state
  useEffect(() => {
    if (gameState && gameState.activeCheckIndex !== undefined) {
      setLocalActiveCheckIndex(gameState.activeCheckIndex);
      if (gameState.activeCheckIndex === null) {
        setIsRevealed(false);
      }
    }
  }, [gameState?.activeCheckIndex]);

  const activeCheckIndex = localActiveCheckIndex;

  // Timer starting fresh at 00:00 on each player change
  useEffect(() => {
    if (activeCheckIndex !== null) {
      setSeconds(0);
      const interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCheckIndex]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleOpenCheck = (index: number) => {
    setLocalActiveCheckIndex(index);
    setIsRevealed(false);
    if (onUpdateState) {
      onUpdateState(prev => ({ ...prev, activeCheckIndex: index }));
    }
  };

  const handleCloseCheck = () => {
    if (activeCheckIndex !== null) {
      setCheckedStatus(prev => ({ ...prev, [activeCheckIndex]: true }));
    }
    setLocalActiveCheckIndex(null);
    setIsRevealed(false);
    if (onUpdateState) {
      onUpdateState(prev => ({ ...prev, activeCheckIndex: null }));
    }
  };

  const allChecked = players.every((_, idx) => checkedStatus[idx]);

  // Generate lists of secrets based on roles
  const getSecretText = (player: Player) => {
    if (player.role === Role.CITIZEN) {
      return (
        <div className="space-y-4">
          <p className="text-lg text-gray-200 leading-relaxed">
            당신은 어떠한 특수 능력이 없는 순수한 <span className="text-gold-400 font-extrabold text-xl">시민</span>입니다.
          </p>
          <div className="bg-black/50 border border-gold-900/30 p-4 rounded-xl text-left space-y-2">
            <h5 className="text-xs font-bold font-mono text-gold-500 uppercase tracking-wider">시민 행동 강령</h5>
            <p className="text-sm text-gray-300 leading-relaxed">
              배심원 재판에 추천될 경우 신중히 생각하여 <span className="text-green-400 font-bold">유죄(Guilty)</span>를 투표해야 합니다. 범죄자들의 거짓 선동에 넘어가지 않도록 조심하십시오!
            </p>
          </div>
        </div>
      );
    }

    if (player.role === Role.CITIZEN_LEADER) {
      // Find ordinary criminals (Role.CRIMINAL) and shuffle them to avoid exposing criminal leader
      const ordinaryCriminals = players
        .filter(p => p.role === Role.CRIMINAL)
        .map(p => p.name);
      
      return (
        <div className="space-y-5">
          <p className="text-base text-gold-400 font-extrabold leading-relaxed">
            당신은 동료 시민들을 구원할 영웅, <span className="text-xl text-gold-300 underline underline-offset-4 font-black">[시민 리더]</span>입니다!
          </p>
          
          <div className="bg-black/60 border border-gold-500/30 p-4 rounded-xl text-left space-y-3 shadow-inner">
            <span className="text-sm font-bold tracking-wider text-amber-300 block border-b border-gold-900/30 pb-1.5 uppercase">
              🔍 감지된 일반 범죄자 명단 (리더 제외, 무작위 순서)
            </span>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {ordinaryCriminals.length === 0 ? (
                <span className="text-sm text-gray-400 italic">감지된 일반 범죄자가 없습니다.</span>
              ) : (
                ordinaryCriminals.map((name, i) => (
                  <span key={i} className="px-4 py-2 bg-red-950/70 text-red-200 border border-red-500/40 rounded-lg text-lg font-black tracking-wide shadow-md">
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>
          
          <p className="text-xs text-gray-400 leading-relaxed text-left bg-gold-950/10 p-3 rounded-lg border border-gold-950/40">
            ⚠️ <strong className="text-gold-400">주의사항</strong>: 범죄자 팀 리더의 이름은 당신에게도 감지되지 않습니다! 또한 게임이 최종 종료될 때 범죄자 리더가 당신을 정조준해 저격하면 대역전패하게 되므로, 시민 리더 본인의 정체를 일반 시민인 것처럼 철저히 숨기십시오.
          </p>
        </div>
      );
    }

    // For Criminal and Criminal Leader
    const allCriminalNames = players
      .filter(p => p.role === Role.CRIMINAL || p.role === Role.CRIMINAL_LEADER)
      .map(p => p.name);

    const isLeader = player.role === Role.CRIMINAL_LEADER;

    return (
      <div className="space-y-5">
        <p className="text-base text-red-400 font-extrabold leading-relaxed">
          당신은 비밀 결사의 핵심 단원, <span className="text-xl text-red-500 font-black">{isLeader ? '[범죄자 리더]' : '[범죄자]'}</span>입니다!
        </p>
        
        <div className="bg-black/60 border border-red-500/30 p-4 rounded-xl text-left space-y-3 shadow-inner">
          <span className="text-sm font-bold tracking-wider text-red-400 block border-b border-red-900/30 pb-1.5 uppercase">
            🕵️ 범죄자 동료 명단 (나를 포함한 전원 정보)
          </span>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {allCriminalNames.map((name, i) => (
              <span key={i} className="px-4 py-2 bg-red-900/30 text-red-300 border border-red-600/40 rounded-lg text-lg font-black tracking-wide shadow-md">
                {name}
              </span>
            ))}
          </div>
        </div>
        
        <p className="text-xs text-gray-400 leading-relaxed text-left bg-red-950/10 p-3 rounded-lg border border-red-950/40">
          💡 <strong className="text-red-400">승리 전략</strong>: 시민 팀을 속여 3번의 재판에서 한 표 이상의 무죄 표를 내 승리하거나, 시민 팀이 승리 조건을 달성하더라도 마지막에 시민 리더의 정확한 정체를 저격하여 대역전승을 쟁취하십시오.
        </p>
      </div>
    );
  };

  const handleForceSkip = () => {
    if (window.confirm('모든 정체 확인 단계를 무시하고 배심원장 순서 결정으로 넘어가시겠습니까? (테스트 시 권장)')) {
      players.forEach((_, idx) => {
        checkedStatus[idx] = true;
      });
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-widest text-gold-400 uppercase">
          개별 비밀 정체 확인
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          모든 플레이어는 교사용 컴퓨터 앞으로 한 명씩 나와 비밀리에 정체를 확인해 주세요.
        </p>
        <div className="w-16 h-[2px] bg-gold-600 mx-auto mt-3" />
      </div>

      {/* Grid of Players */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {players.map((player, idx) => {
          const isChecked = checkedStatus[idx];
          return (
            <button
              key={player.id}
              id={`identity-check-card-${idx}`}
              onClick={() => handleOpenCheck(idx)}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-3 transition-all ${
                isChecked
                  ? 'bg-emerald-950/10 border-emerald-900/40 text-emerald-300'
                  : 'bg-[#0f111a] border-gold-900/20 hover:border-gold-500/50 text-gray-300 hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-full ${isChecked ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gold-950/20 text-gold-500'}`}>
                {isChecked ? <Check className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">PLAYER {idx + 1}</p>
                <p className="font-bold text-sm mt-0.5">{player.name}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isChecked ? 'bg-emerald-950 text-emerald-400' : 'bg-black/40 text-gold-500'
              }`}>
                {isChecked ? '확인 완료' : '대기 중'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          id="proceed-to-round-btn"
          onClick={onComplete}
          disabled={!allChecked}
          className={`px-8 py-3.5 rounded-lg text-sm font-bold tracking-widest font-display uppercase transition-all flex items-center gap-2 ${
            allChecked
              ? 'bg-gold-500 text-black hover:bg-gold-400 shadow-lg shadow-gold-950/30'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> 배심원장 순서 확정하기
        </button>
      </div>

      {/* Pop-up Screen Guard/Modal for Secret Check - Optimized with Wide Landscape grid & timer */}
      {activeCheckIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <div 
            id="secret-identity-card"
            className="w-full max-w-4xl bg-[#0b0c10] border-2 border-gold-600 rounded-2xl p-8 shadow-2xl shadow-gold-950/40 relative flex flex-col justify-between min-h-[450px]"
          >
            {/* Top Bar with Timer */}
            <div className="flex justify-between items-center border-b border-gold-950/40 pb-4 mb-6">
              <div className="text-left">
                <p className="text-xs font-mono tracking-widest text-gold-500 uppercase">CONFIDENTIAL SCREEN GUARD</p>
                <h3 className="font-display text-2xl font-black text-white mt-1">
                  {players[activeCheckIndex].name}의 비밀 확인 차례
                </h3>
              </div>
              
              {/* Dynamic Running Timer */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 bg-gold-950/50 border border-gold-600/30 px-3.5 py-1.5 rounded-lg text-gold-400 font-mono font-bold text-sm">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                  <span>정체 확인 시간:</span>
                  <span className="text-white text-base font-black">{formatTimer(seconds)}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  학생별로 정체 확인 시간을 일정하게 유지해주세요.
                </span>
              </div>
            </div>

            {/* Main content - grid changes dynamically */}
            {!isRevealed ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-6">
                <div className="w-20 h-20 bg-gold-950/30 rounded-full flex items-center justify-center border border-gold-900/60 text-gold-400 animate-pulse">
                  <EyeOff className="w-10 h-10" />
                </div>
                <div className="space-y-2 text-center max-w-lg">
                  <p className="text-lg font-bold text-gray-200">
                    화면 가림 블라인드가 활성화되어 있습니다.
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    본인을 제외한 주변의 다른 학생들은 정체 정보가 유출되지 않도록 <strong className="text-gold-400 font-semibold">교사용 컴퓨터 화면을 보거나 다가오지 않도록</strong> 각별히 지도해 주십시오.
                  </p>
                </div>
                <button
                  id="reveal-my-identity-btn"
                  onClick={() => setIsRevealed(true)}
                  className="px-8 py-4 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-500 text-black font-extrabold text-sm rounded-lg transition shadow-lg shadow-gold-950/30 uppercase tracking-widest cursor-pointer"
                >
                  보안 해제 및 비밀 확인하기
                </button>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
                {/* Left: Role Info */}
                <div className="md:col-span-5 text-center flex flex-col items-center justify-center space-y-4 border-r border-gold-950/30 pr-0 md:pr-8">
                  <div className="p-4 bg-gold-950/20 rounded-full border border-gold-500/30 w-20 h-20 flex items-center justify-center text-gold-400 shadow-lg">
                    <Eye className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">YOUR SECRET ASSIGNED ROLE</span>
                    <h4 className={`text-3xl font-black mt-2 font-display tracking-widest ${
                      players[activeCheckIndex].role.includes('criminal') ? 'text-red-500 drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]' : 'text-gold-400 drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)]'
                    }`}>
                      {players[activeCheckIndex].role === Role.CITIZEN && '시민 (CITIZEN)'}
                      {players[activeCheckIndex].role === Role.CITIZEN_LEADER && '시민 리더 (LEADER)'}
                      {players[activeCheckIndex].role === Role.CRIMINAL && '범죄자 (CRIMINAL)'}
                      {players[activeCheckIndex].role === Role.CRIMINAL_LEADER && '범죄자 리더 (LEADER)'}
                    </h4>
                  </div>
                </div>

                {/* Right: Secret Details & Allies (Wide & Visible) */}
                <div className="md:col-span-7 space-y-4">
                  {getSecretText(players[activeCheckIndex])}
                </div>
              </div>
            )}

            {/* Bottom button */}
            {isRevealed && (
              <div className="mt-6 pt-4 border-t border-gold-950/40 text-center space-y-3">
                <button
                  id="hide-and-complete-identity-btn"
                  onClick={handleCloseCheck}
                  className="w-full max-w-md mx-auto py-3.5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-extrabold text-sm rounded-lg shadow-lg transition uppercase tracking-widest cursor-pointer"
                >
                  확인 완료! 화면 다시 숨기기 (블라인드 가림)
                </button>
                <p className="text-xs text-gray-500">
                  * 위 버튼을 누르면 즉시 전체 비밀 정보가 가려지며, 메인 플레이어 명단 화면으로 돌아갑니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
