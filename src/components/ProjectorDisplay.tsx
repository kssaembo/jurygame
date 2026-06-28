import { useState, useEffect } from 'react';
import { GameState, Role } from '../types';
import { Shield, Award, Users, AlertOctagon, HelpCircle, Eye, RefreshCw, Star, Skull } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

interface ProjectorDisplayProps {
  gameState: GameState;
}

export default function ProjectorDisplay({ gameState }: ProjectorDisplayProps) {
  const {
    players,
    currentRound,
    phase,
    juryPresidentOrder,
    currentPresidentOrderIndex,
    consecutiveRejections,
    currentProposal,
    proposalApproveCount,
    roundsHistory,
    winnerTeam,
    votedStatus,
    currentSecretVotes,
    activeVoterIndex,
    assassinationStage,
    assassinationTargetIndex,
    assassinationSuccess,
    finalWinner,
    activeCheckIndex,
  } = gameState;

  // Track revealed votes in ballot_result phase
  const [revealedVotes, setRevealedVotes] = useState<boolean[]>([]);

  // Reset revealed votes when moving into ballot_result
  useEffect(() => {
    if (phase === 'ballot_result') {
      setRevealedVotes(new Array(currentSecretVotes.length).fill(false));
    } else {
      setRevealedVotes([]);
    }
  }, [phase, currentSecretVotes.length]);

  const handleRevealCard = (idx: number) => {
    setRevealedVotes(prev => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
  };

  const handleRevealAll = () => {
    setRevealedVotes(new Array(currentSecretVotes.length).fill(true));
  };

  const toRoman = (num: number): string => {
    const map = ['O', 'I', 'II', 'III', 'IV', 'V'];
    return map[num] || num.toString();
  };

  // Precalculate jury sizes for reference
  const getJurySize = (total: number, round: number): number => {
    if (total <= 6) {
      if (round <= 2) return 2;
      if (round <= 4) return 3;
      return 3;
    }
    if (round === 1 || round === 2) return Math.max(2, Math.round(total * 4 / 12));
    if (round === 3 || round === 4) return Math.max(3, Math.round(total * 5 / 12));
    return Math.max(3, Math.round(total * 6 / 12));
  };

  const jurySize = players.length > 0 ? getJurySize(players.length, currentRound) : 0;
  const currentPresident = players[juryPresidentOrder[currentPresidentOrderIndex]] || null;

  // Render Setup Phase
  if (phase === 'setup') {
    return (
      <div id="projector-setup" className="h-full flex flex-col justify-center items-center p-8 text-center genius-gradient-bg border-4 border-double border-gold-800/30 rounded-2xl min-h-[550px]">
        <div className="space-y-6 max-w-2xl animate-fade-in">
          <div className="flex justify-center mb-2 animate-bounce">
            <div className="p-4 bg-gold-950/40 rounded-full border border-gold-500/40 shadow-lg shadow-gold-950/50">
              <Shield className="w-16 h-16 text-gold-400" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-black tracking-widest text-gold-400 uppercase drop-shadow-[0_4px_12px_rgba(103,68,21,0.5)]">
            배심원 게임
          </h1>
          <p className="text-sm font-mono tracking-[0.3em] text-gold-500/70 uppercase">
            Jury Trial Classroom Board
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-600/50 to-transparent w-full" />
          
          <div className="bg-black/40 border border-gold-900/20 p-8 rounded-2xl space-y-3 shadow-2xl">
            <p className="text-gray-200 font-extrabold text-2xl">
              대기 중
            </p>
            <p className="text-base text-gray-400 font-semibold leading-relaxed">
              게임 진행 상황과 라운드 결과를 표시합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render President Order Phase
  if (phase === 'president_order') {
    return (
      <div id="projector-president-order" className="h-full flex flex-col justify-center items-center p-8 text-center genius-gradient-bg border-4 border-double border-gold-800/30 rounded-2xl min-h-[550px] justify-between">
        <div className="space-y-6 w-full max-w-4xl">
          <div className="space-y-1">
            <span className="text-xs font-mono tracking-widest text-gold-500 uppercase font-black">JURY PRESIDENT DRAW</span>
            <h2 className="font-display text-4xl font-black text-white">
              배심원장 순서 결정
            </h2>
            <p className="text-sm text-gray-400">
              배심원단을 구성할 권한을 갖는 배심원장들의 무작위 선출 순서를 정합니다.
            </p>
          </div>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-600/40 to-transparent w-full my-4" />

          {gameState.isShufflingOrder ? (
            <div className="py-12 space-y-6">
              <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl font-bold text-gold-400 tracking-wider animate-pulse">배심원장 순서 셔플 중...</p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto opacity-70">
                {(gameState.tempJuryOrder || []).map((playerIdx, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-xs text-gray-400 rounded-lg animate-pulse">
                    {players[playerIdx]?.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (gameState.tempJuryOrder && gameState.tempJuryOrder.length > 0) || (juryPresidentOrder && juryPresidentOrder.length > 0) ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gold-400">🎉 배심원장 순서가 확정되었습니다 🎉</h3>
              <div className="bg-black/40 border border-gold-900/20 rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {((gameState.tempJuryOrder && gameState.tempJuryOrder.length > 0) ? gameState.tempJuryOrder : juryPresidentOrder).map((playerIdx, orderIdx) => {
                    const p = players[playerIdx];
                    return (
                      <div
                        key={orderIdx}
                        className="flex flex-col items-center justify-between p-4 bg-gradient-to-b from-gold-950/20 to-black/50 border border-gold-900/30 rounded-xl text-center shadow-md animate-fade-in"
                      >
                        <span className="font-mono text-xs font-black text-gold-500 mb-2">#{orderIdx + 1}</span>
                        <PlayerAvatar index={playerIdx} className="w-12 h-12 mb-2" />
                        <span className="font-black text-sm text-gray-200">{p?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 mx-auto animate-pulse">
                ?
              </div>
              <p className="text-sm text-gray-500 italic">
                교사 화면에서 배심원장 순서 결정을 대기하고 있습니다...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Identity Check Phase
  if (phase === 'identity_check') {
    const hasActivePlayer = activeCheckIndex !== null && activeCheckIndex !== undefined;
    const activePlayerName = hasActivePlayer ? players[activeCheckIndex]?.name : '';

    return (
      <div id="projector-identity-check" className="h-full flex flex-col justify-center items-center p-8 text-center genius-gradient-bg border-4 border-double border-gold-800/30 rounded-2xl min-h-[550px]">
        <div className="space-y-6 max-w-3xl animate-fade-in w-full">
          <div className="flex justify-center">
            <div className={`p-5 rounded-full border border-gold-600/30 text-gold-400 shadow-xl ${hasActivePlayer ? 'bg-gold-950/30 animate-bounce' : 'bg-gold-950/10'}`}>
              <Eye className="w-16 h-16" />
            </div>
          </div>
          <h2 className="font-display text-4xl font-black tracking-widest text-gold-400 uppercase">
            비밀 정체 배정 중
          </h2>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-600/40 to-transparent w-full" />
          
          <div className="py-6 min-h-[120px] flex items-center justify-center">
            {hasActivePlayer ? (
              <p className="text-3xl font-black text-white leading-relaxed max-w-2xl animate-pulse">
                📢 <span className="text-gold-400 underline underline-offset-4">{activePlayerName}</span> 플레이어는 선생님 컴퓨터 앞으로 나와서 정체를 확인해 주세요.
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-200">
                "각 조의 대표는 선생님 컴퓨터 앞으로 나와 주십시오"
              </p>
            )}
          </div>

          <div className="bg-black/60 p-5 rounded-2xl border border-red-950/40 max-w-md mx-auto space-y-3 text-left shadow-lg">
            <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
              ⚠️ 주의 (Class Rules)
            </p>
            <ul className="text-xs text-gray-400 list-disc list-inside space-y-2">
              <li>다른 학생들은 정체 확인 중 화면을 보거나 자리를 이탈해서는 안 됩니다.</li>
              <li>자신의 정체 카드를 확인한 후 비밀을 유지해 주세요.</li>
              <li>정체 확인 시 자신의 정체가 노출될 수 있는 리액션을 하지 말아주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="projector-active-board" className="p-6 bg-[#07080b] border-4 border-double border-gold-800/40 rounded-2xl flex flex-col h-full min-h-[550px] justify-between">
      
      {/* Top Banner & Rounds Track */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gold-900/30 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-gold-400 font-extrabold text-xs tracking-widest">ROUND STATUS</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(r => {
                const isPassed = roundsHistory.find(h => h.round === r);
                const isCurrent = currentRound === r;
                let verdictText = '-';
                if (isPassed) {
                  verdictText = isPassed.result === 'citizen' ? '유죄' : '무죄';
                } else if (isCurrent) {
                  verdictText = '진행중';
                }
                return (
                  <div
                    key={r}
                    className={`w-14 py-1.5 rounded text-center text-xs font-mono font-black transition-all flex flex-col justify-center items-center ${
                      isPassed
                        ? isPassed.result === 'citizen'
                          ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                          : 'bg-red-950 border border-red-500 text-red-400'
                        : isCurrent
                        ? 'bg-gold-500 text-black font-extrabold shadow shadow-gold-500/50 animate-pulse'
                        : 'bg-black/60 border border-gray-800 text-gray-600'
                    }`}
                  >
                    <span className="font-mono text-xs block font-bold">R{r}</span>
                    <span className="text-[9px] font-medium block mt-0.5">{verdictText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-right">
            <h3 className="font-display text-gold-400 text-lg font-bold tracking-widest">
              {phase === 'game_over' ? '최종 판결' : `제 ${toRoman(currentRound)}차 재판`}
            </h3>
            <p className="text-[10px] font-mono text-gray-500 tracking-wider">
              {phase === 'game_over' ? 'GAME OVER & RETROSPECTIVE' : ''}
            </p>
          </div>
        </div>

        {/* President Progression Track */}
        {phase !== 'game_over' && juryPresidentOrder.length > 0 && (
          <div className="bg-black/40 border border-gold-950 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
              <span className="text-gold-500 font-bold uppercase">배심원장 순서 현황 (Jury Presidents Order)</span>
              <span className="text-red-400">연속 인준 부결: {consecutiveRejections} / 5</span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
              {juryPresidentOrder.map((playerIdx, idx) => {
                const p = players[playerIdx];
                const isActive = idx === currentPresidentOrderIndex;
                const isPassed = idx < currentPresidentOrderIndex;
                return (
                  <div
                    key={idx}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap border flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-gold-950 border-gold-500 text-gold-300 font-bold scale-105 shadow shadow-gold-950'
                        : isPassed
                        ? 'bg-black/60 border-gray-900 text-gray-600 line-through'
                        : 'bg-black/20 border-gray-800/40 text-gray-400'
                    }`}
                  >
                    {isActive && <Star className="w-3 h-3 text-gold-400 fill-gold-400" />}
                    <span>{p?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Stage Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 my-2 text-center">
        
        {/* Phase: Round Proposal (Nominating Jury) */}
        {phase === 'round_proposal' && currentPresident && (
          <div className="space-y-6 w-full max-w-xl animate-fade-in">
            <div className="space-y-2">
              <p className="text-xs font-mono tracking-widest text-gold-500 uppercase">JURY PRESIDENT ACTIVE</p>
              <h4 className="text-3xl font-display font-extrabold text-white flex items-center justify-center gap-2">
                👑 <span className="text-gold-400 underline decoration-gold-600 underline-offset-4">{currentPresident.name}</span> 배심원장
              </h4>
              <p className="text-sm text-gray-300">
                이번 재판을 이끌어갈 배심원단 <span className="text-gold-300 font-bold">{jurySize}명</span>을 골라 호명해 주세요!
              </p>
            </div>

            <div className="bg-[#0b0c11] border-2 border-gold-900/40 p-6 rounded-xl space-y-4 shadow-xl">
              <h5 className="text-sm font-black text-gold-400 tracking-wider uppercase">선택된 배심원 후보 (Nominated Jury)</h5>
              {currentProposal.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 text-xs italic">
                  배심원장이 학생 이름을 호명하면 교사가 컴퓨터에 등록합니다...
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  {currentProposal.map((idx, pIdx) => (
                    <div
                      key={idx}
                      className="px-5 py-4 bg-[#0d0e14] border-2 border-gold-500/70 text-gold-300 font-bold rounded-2xl text-lg shadow-xl flex flex-col items-center gap-2.5 w-32 animate-fade-in relative overflow-hidden"
                    >
                      <div className="absolute top-1.5 left-2 text-[9px] font-mono text-gold-600/80">#{pIdx + 1}</div>
                      <PlayerAvatar index={idx} className="w-14 h-14" />
                      <span className="tracking-wide text-base">{players[idx]?.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-gray-400">
                모든 배심원이 선정되면 찬반 인준 투표가 시작됩니다.
              </div>
            </div>
          </div>
        )}

        {/* Phase: Proposal Vote (Class Approval of Jury) */}
        {phase === 'proposal_vote' && currentPresident && (
          <div className="space-y-6 w-full max-w-xl">
            <div className="space-y-1">
              <p className="text-xs font-mono tracking-widest text-crimson-500 uppercase">JURY NOMINEE RATIFICATION</p>
              <h4 className="text-2xl font-display font-bold text-white">
                배심원단 인준 거수 찬반 투표
              </h4>
              <p className="text-xs text-gray-400">
                배심원장 <span className="text-gold-400 font-semibold">{currentPresident.name}</span>의 배심원단 제안에 찬성하십니까?
              </p>
            </div>

            {/* Proposed list card */}
            <div className="p-4 bg-black/60 border border-gold-900/30 rounded-xl space-y-2">
              <p className="text-xs font-bold text-gold-500 font-mono">제안된 배심원 후보 명단</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {currentProposal.map(idx => (
                  <span key={idx} className="px-3 py-1 bg-gold-950/30 text-gold-300 border border-gold-800/40 rounded text-xs font-bold">
                    {players[idx]?.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Voting rules overlay */}
            <div className="p-5 bg-amber-950/10 border border-gold-600/30 rounded-xl flex flex-col items-center justify-center space-y-2">
              <p className="text-xs text-gray-400">전체 학생 거수 찬성 필수 기준</p>
              <div className="px-4 py-1.5 bg-gold-600 text-black font-extrabold text-sm rounded-full shadow">
                과반수 ({Math.ceil(players.length / 2)}명 이상) 찬성 필요
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed italic mt-1">
                * 찬성 수가 정원의 과반수인 경우 가결되어 배심원단이 확정되며 비밀 재판이 시작됩니다.<br />
                * 부결 시 즉시 다음 배심원장 순서로 넘어갑니다. (연속 5회 부결 시 라운드 실패 처리)
              </p>
            </div>
          </div>
        )}

        {/* Phase: Secret Ballot (Jury Voting) */}
        {phase === 'secret_ballot' && (
          <div className="space-y-6 w-full max-w-xl">
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-red-950 border border-red-500/40 text-red-400 rounded-full text-[10px] font-mono tracking-widest uppercase animate-pulse">
                COURT IS IN SESSION
              </span>
              <h4 className="text-3xl font-display font-extrabold text-white">
                익명 배심원 비밀 투표 중
              </h4>
              <p className="text-sm text-gray-400">
                선정된 배심원들은 한 명씩 나와 비밀리에 배심 투표를 해주세요.
              </p>
            </div>

            {/* Nominated jury list & Voted Status */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {currentProposal.map(idx => {
                const name = players[idx]?.name;
                const hasVoted = votedStatus[idx];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all duration-300 ${
                      hasVoted
                        ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/40 border-gray-800 text-gray-500'
                    }`}
                  >
                    <span className="text-xs font-bold">{name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      hasVoted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-900 text-gray-600'
                    }`}>
                      {hasVoted ? '투표 완료' : '대기 중'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-gray-500 italic max-w-xs mx-auto">
              🔐 완벽한 익명성을 위해 배심원 개개인의 찬반 투표 직후 화면이 가려지며, 표가 섞여서 최종 송출됩니다.
            </div>
          </div>
        )}

        {/* Phase: Ballot Result (Reveal & Verdict) */}
        {phase === 'ballot_result' && (
          <div className="space-y-6 w-full max-w-2xl">
            <div className="space-y-1">
              <p className="text-xs font-mono tracking-widest text-gold-500 uppercase">THE VERDICT OF THE TRIAL</p>
              <h4 className="text-3xl font-display font-black text-white">
                투표 결과 개봉
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">
                카드를 클릭하여 투표 결과를 하나씩 뒤집어 확인하세요.
                <br />
                <span className="text-gold-500 font-semibold">(보이는 카드 결과는 투표 순서와 상관없이 랜덤으로 보여집니다.)</span>
              </p>
            </div>

            {/* Flippable Cards - Sorted: 'guilty' first, then 'innocent' */}
            <div className="flex flex-wrap justify-center gap-4 py-4">
              {[...currentSecretVotes]
                .sort((a, b) => {
                  if (a === 'guilty' && b === 'innocent') return -1;
                  if (a === 'innocent' && b === 'guilty') return 1;
                  return 0;
                })
                .map((vote, idx) => {
                  const isOpen = revealedVotes[idx];
                  return (
                    <button
                      key={idx}
                      id={`projector-ballot-card-${idx}`}
                      onClick={() => handleRevealCard(idx)}
                      className={`w-28 h-40 focus:outline-none rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-xl ${
                        isOpen
                          ? vote === 'guilty'
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-950/50'
                            : 'bg-red-950/40 border-red-500 shadow-red-950/50'
                          : 'bg-[#0d0e12] border-gold-600/60 hover:border-gold-400 cursor-pointer animate-pulse'
                      }`}
                      disabled={isOpen}
                    >
                      {!isOpen ? (
                        <div className="h-full flex flex-col justify-between p-3 text-center">
                          <div className="text-[8px] font-mono text-gold-600 font-bold text-left">COURT SEAL</div>
                          <div className="flex justify-center text-gold-500">
                            <Shield className="w-8 h-8 fill-gold-950/30 text-gold-500/80" />
                          </div>
                          <div className="text-[10px] font-sans text-gold-400 font-bold tracking-wider">
                            클릭하여 개봉
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-between p-3 text-center animate-fade-in">
                          <div className="text-[8px] font-mono text-gray-500 text-left">VERDICT</div>
                          <div className="flex flex-col items-center justify-center flex-1">
                            {vote === 'guilty' ? (
                              <>
                                <Award className="w-12 h-12 text-emerald-400 mb-1" />
                                <span className="font-display font-black text-xl text-emerald-300">유죄</span>
                                <span className="text-[9px] font-mono text-emerald-500">GUILTY</span>
                              </>
                            ) : (
                              <>
                                <Skull className="w-12 h-12 text-red-400 mb-1" />
                                <span className="font-display font-black text-xl text-red-300">무죄</span>
                                <span className="text-[9px] font-mono text-red-500">INNOCENT</span>
                              </>
                            )}
                          </div>
                          <div className="text-[8px] font-mono text-gray-500">ROUND {currentRound}</div>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Quick Actions for reveals */}
            {!revealedVotes.every(v => v) && (
              <button
                id="projector-reveal-all-btn"
                onClick={handleRevealAll}
                className="px-4 py-1.5 border border-gold-800 text-gold-400 hover:text-white rounded text-xs hover:bg-gold-950/30 transition flex items-center gap-1.5 mx-auto animate-fade-in"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 투표 용지 한꺼번에 모두 개봉
              </button>
            )}

            {/* Verdict Display - Only shows when all are revealed! */}
            {revealedVotes.every(v => v) && (
              <div className="space-y-4">
                <div className="p-5 border-2 genius-gold-border rounded-xl bg-black/80 max-w-md mx-auto space-y-2 animate-fade-in shadow-2xl">
                  <p className="text-xs font-mono tracking-widest text-gold-500 uppercase">FINAL RULING</p>
                  
                  {roundsHistory.find(h => h.round === currentRound)?.result === 'citizen' ? (
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-black text-emerald-400 tracking-wider">
                        유죄 판결 (GUILTY)
                      </h4>
                      <p className="text-xs text-gray-300">
                        배심원단의 판단 결과, 피고인의 <span className="text-emerald-400 font-bold">유죄</span>가 선고되었습니다!
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded text-xs font-bold text-emerald-300">
                        시민 팀 라운드 승리 🎉
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h4 className="text-3xl font-display font-black text-red-500 tracking-wider">
                        무죄 판결 (INNOCENT)
                      </h4>
                      <p className="text-xs text-gray-300">
                        배심원단의 판단 결과, 피고인의 <span className="text-red-400 font-bold">무죄</span>가 선고되었습니다!
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-red-950/50 border border-red-500/30 rounded text-xs font-bold text-red-300">
                        범죄자 팀 라운드 승리 💀
                      </span>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-500 italic pt-2 border-t border-gray-800">
                    * 룰 리마인더: 시민 팀이 유죄를 받아내기 위해서는 만장일치 유죄가 기본 규칙입니다.<br />
                    (단, 4라운드는 무죄가 1표 이하인 경우 유죄 판정으로 시민이 이깁니다)
                  </p>
                </div>

                <div className="text-center pt-2">
                  <span className="text-xs font-bold text-gold-500/60 bg-black/40 px-3 py-1.5 rounded-full border border-gold-950/30">교사 운영 화면</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: Game Over (Victory Retrospective & Final Sniping) */}
        {phase === 'game_over' && (
          <div className="space-y-8 w-full max-w-6xl transform transition-all duration-700 scale-100 animate-fade-in mx-auto">
            {/* If we are in the sniping stage, show the drama */}
            {assassinationStage ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 bg-red-950 text-red-400 rounded-full text-xs font-bold font-mono tracking-widest border border-red-500/30 animate-pulse uppercase">
                    THE SNIPER ROUND
                  </span>
                  <h3 className="text-3xl font-display font-black text-white">
                    최종 역전 리더 저격
                  </h3>
                  <p className="text-sm text-gray-300">
                    {winnerTeam === 'citizen' ? (
                      <span>재판 결과 <span className="text-gold-400 font-bold">시민 팀(3승)</span>이 승리했으나, 범죄자 리더에게 최후의 역전 기회가 부여됩니다!</span>
                    ) : (
                      <span>재판 결과 <span className="text-crimson-400 font-bold">범죄자 팀(3승)</span>이 승리했으나, 시민 리더에게 최후의 역전 기회가 부여됩니다!</span>
                    )}
                  </p>
                </div>

                <div className="p-6 bg-[#0d0e12] border border-red-900/40 rounded-xl space-y-4 shadow-xl">
                  <p className="text-xs text-red-400 font-bold tracking-wider">🎯 TARGET ASSASSINATION RULE</p>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                    {winnerTeam === 'citizen' ? (
                      <span>패배한 <span className="text-red-400 font-bold">범죄자 팀 리더</span>가 시민 팀의 <span className="text-gold-400 font-bold">시민 리더</span>를 저격하여 맞추면 범죄자 팀의 역전 승리! 틀리면 시민 팀의 완승으로 종료됩니다.</span>
                    ) : (
                      <span>패배한 <span className="text-gold-400 font-bold">시민 팀 리더</span>가 범죄자 팀의 <span className="text-red-400 font-bold">범죄자 리더</span>를 저격하여 맞추면 시민 팀의 역전 승리! 틀리면 범죄자 팀의 완승으로 종료됩니다.</span>
                    )}
                  </p>
                  
                  {assassinationTargetIndex !== null && (
                    <div className="py-2.5 px-5 bg-red-950/20 border border-red-800/40 rounded-xl text-red-300 text-sm font-bold max-w-xs mx-auto animate-pulse">
                      조준 표적: {players[assassinationTargetIndex]?.name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Ultimate winner declared!
              <div className="space-y-8 animate-fade-in relative overflow-hidden w-full">
                {/* Floating particles background on projector */}
                <div className="absolute inset-0 pointer-events-none flex justify-around items-center opacity-30 select-none">
                  <span className="text-5xl animate-bounce duration-1000">🎉</span>
                  <span className="text-5xl animate-bounce duration-700">✨</span>
                  <span className="text-5xl animate-bounce duration-900">🏆</span>
                  <span className="text-5xl animate-bounce duration-1200">⭐</span>
                  <span className="text-5xl animate-bounce duration-800">🎉</span>
                </div>

                <div className="flex justify-center animate-bounce">
                  <div className={`p-8 rounded-full border-2 shadow-2xl relative ${
                    finalWinner === 'citizen'
                      ? 'bg-gold-950/20 border-gold-500 text-gold-400 shadow-gold-950/40'
                      : 'bg-red-950/20 border-red-500 text-red-400 shadow-red-950/40'
                  }`}>
                    <Award className="w-24 h-24" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-mono tracking-widest text-gold-500 uppercase font-black">COMMEMORATION CELEBRATION</p>
                  <div className="flex justify-center items-center w-full">
                    <h3 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-widest uppercase filter drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-pulse whitespace-nowrap ${
                      finalWinner === 'citizen' ? 'text-gold-400' : 'text-red-500'
                    }`}>
                      {finalWinner === 'citizen' ? '🏆 시민 팀 최종 승리 🏆' : '💀 범죄자 팀 최종 승리 💀'}
                    </h3>
                  </div>
                </div>

                {/* Final Retrospective Table */}
                <div className="bg-black/40 border border-gold-900/30 rounded-2xl p-8 max-w-6xl w-full mx-auto space-y-6 text-left shadow-2xl">
                  <h5 className="text-xl font-black text-gold-400 tracking-wider text-center uppercase border-b border-gold-950/40 pb-4">플레이어 역할 공개</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {players.map((p, idx) => (
                      <div key={p.id} className="p-6 rounded-xl bg-[#0e1017] border border-gray-800 flex flex-col items-center justify-center text-center gap-4 min-h-[220px] shadow-lg hover:border-gold-500/20 transition-all duration-300">
                        <PlayerAvatar index={idx} className="w-16 h-16" />
                        <div className="space-y-1.5 flex flex-col items-center">
                          <span className="font-black text-lg text-gray-200 line-clamp-1">{p.name}</span>
                          <span className={`text-xs sm:text-sm font-black px-3 py-1.5 rounded-full ${
                            p.role === Role.CITIZEN_LEADER ? 'bg-gold-950 text-gold-400 border border-gold-500/30' :
                            p.role === Role.CITIZEN ? 'bg-gray-800 text-gray-400' :
                            p.role === Role.CRIMINAL_LEADER ? 'bg-red-950 text-red-400 border border-red-500/30' :
                            'bg-red-950/50 text-red-300'
                          }`}>
                            {p.role === Role.CITIZEN && '시민'}
                            {p.role === Role.CITIZEN_LEADER && '시민 리더'}
                            {p.role === Role.CRIMINAL && '범죄자'}
                            {p.role === Role.CRIMINAL_LEADER && '범죄자 리더'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Footer Area */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-gold-900/20 pt-4 text-xs text-gray-500">
        <p className="text-right ml-auto">교사 운영 화면</p>
      </div>

    </div>
  );
}
