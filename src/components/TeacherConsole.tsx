import { useState, useEffect } from 'react';
import { GameState, Role, Player, RoundResult } from '../types';
import { Users, Shield, Award, HelpCircle, Check, ArrowRight, UserCheck, Eye, EyeOff, AlertTriangle, Play, Skull } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

interface TeacherConsoleProps {
  gameState: GameState;
  onUpdateState: (newState: GameState | ((prev: GameState) => GameState)) => void;
  onOpenManual: () => void;
}

export default function TeacherConsole({ gameState, onUpdateState, onOpenManual }: TeacherConsoleProps) {
  const {
    players,
    currentRound,
    phase,
    juryPresidentOrder,
    currentPresidentOrderIndex,
    consecutiveRejections,
    currentProposal,
    proposalApproveCount,
    votedStatus,
    currentSecretVotes,
    activeVoterIndex,
    roundsHistory,
    winnerTeam,
    assassinationStage,
    assassinationTargetIndex,
    assassinationSuccess,
    finalWinner,
  } = gameState;

  // Local helper to log events
  const addLog = (category: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    onUpdateState(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, category, message }]
    }));
  };

  // State for secret voting sub-phases
  // 'blind' -> Voter has not opened ballot yet
  // 'voting' -> Voter sees guilty/innocent options
  // 'feedback' -> Voter clicked, screen covers immediately, wait for next voter
  const [voteSubPhase, setVoteSubPhase] = useState<'blind' | 'voting' | 'feedback'>('blind');

  // State for sniper selection
  const [selectedSniperTarget, setSelectedSniperTarget] = useState<number | null>(null);

  // States for dynamic random sequencing simulation
  const [isGeneratingOrder, setIsGeneratingOrder] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [tempJuryOrder, setTempJuryOrder] = useState<number[]>([]);

  // State for jury size exceeding warning
  const [juryWarning, setJuryWarning] = useState<string | null>(null);

  useEffect(() => {
    if (juryWarning) {
      const timer = setTimeout(() => {
        setJuryWarning(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [juryWarning]);

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

  // Determine President Order
  const handleGeneratePresidentOrder = () => {
    if (players.length === 0) return;
    setIsGeneratingOrder(true);
    onUpdateState(prev => ({
      ...prev,
      isShufflingOrder: true,
      tempJuryOrder: players.map((_, i) => i)
    }));
    
    let count = 0;
    const interval = setInterval(() => {
      const indices = players.map((_, i) => i);
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setTempJuryOrder(shuffled);
      onUpdateState(prev => ({
        ...prev,
        tempJuryOrder: shuffled
      }));
      count++;
      if (count > 10) {
        clearInterval(interval);
        
        // Finalize order
        const finalIndices = players.map((_, i) => i);
        const finalShuffled = [...finalIndices].sort(() => Math.random() - 0.5);
        setTempJuryOrder(finalShuffled);
        setIsGeneratingOrder(false);
        onUpdateState(prev => ({
          ...prev,
          isShufflingOrder: false,
          tempJuryOrder: finalShuffled
        }));
        setShowOrderPopup(true);
      }
    }, 150);
  };

  const handleStartGameWithOrder = () => {
    onUpdateState(prev => ({
      ...prev,
      juryPresidentOrder: tempJuryOrder,
      currentPresidentOrderIndex: 0,
      phase: 'round_proposal',
      isShufflingOrder: false,
      tempJuryOrder: []
    }));
    setShowOrderPopup(false);
    addLog('시스템', '배심원장 선출 순서가 무작위로 확정되었습니다.');
  };

  // Nominate Jury members
  const handleToggleNominee = (playerIndex: number) => {
    const isAlreadySelected = currentProposal.includes(playerIndex);
    if (!isAlreadySelected && currentProposal.length >= jurySize) {
      setJuryWarning('선택한 배심원 숫자가 정원보다 많습니다.');
      return;
    }

    onUpdateState(prev => {
      const proposal = [...prev.currentProposal];
      const idx = proposal.indexOf(playerIndex);
      if (idx > -1) {
        proposal.splice(idx, 1);
      } else {
        proposal.push(playerIndex);
      }
      return { ...prev, currentProposal: proposal };
    });
  };

  const handleConfirmProposal = () => {
    if (currentProposal.length !== jurySize) return;
    onUpdateState(prev => ({
      ...prev,
      phase: 'proposal_vote',
      proposalApproveCount: 0,
    }));
    const nomineeNames = currentProposal.map(idx => players[idx].name).join(', ');
    addLog('배심원추천', `${currentPresident.name} 배심원장이 배심원단(${nomineeNames})을 추천하였습니다.`);
  };

  // Handle Class Votes Approval/Rejection
  const handleClassVoteSubmit = (approved: boolean, inputCount: number) => {
    if (approved) {
      // Approved! Set up ballot phase
      onUpdateState(prev => {
        // Build initial empty status
        const status: { [key: number]: boolean } = {};
        prev.currentProposal.forEach(idx => {
          status[idx] = false;
        });

        return {
          ...prev,
          phase: 'secret_ballot',
          activeVoterIndex: 0, // first index in currentProposal
          votedStatus: status,
          currentSecretVotes: [],
        };
      });
      setVoteSubPhase('blind');
      addLog('인준투표', `배심원단 제안이 가결되었습니다. (찬성: ${inputCount}표). 익명 비밀재판에 돌입합니다.`);
    } else {
      // Rejected! Increment consecutive failures
      onUpdateState(prev => {
        const nextRejections = prev.consecutiveRejections + 1;
        
        if (nextRejections >= 5) {
          // Automatic Trial Failure (Criminal team wins)
          const newResult: RoundResult = {
            round: prev.currentRound,
            juryPresidentIndex: prev.juryPresidentOrder[prev.currentPresidentOrderIndex],
            juryMembers: [...prev.currentProposal],
            approveVotes: inputCount,
            isApproved: false,
            guiltyVotes: 0,
            innocentVotes: jurySize, // Mock innocent wins
            result: 'criminal', // criminal win
          };

          const newHistory = [...prev.roundsHistory, newResult];
          
          // Check for 3 criminal wins
          const criminalWins = newHistory.filter(h => h.result === 'criminal').length;
          const citizenWins = newHistory.filter(h => h.result === 'citizen').length;

          let nextPhase = prev.phase;
          let nextWinner = prev.winnerTeam;
          let sniping = prev.assassinationStage;

          if (criminalWins >= 3) {
            nextPhase = 'game_over';
            nextWinner = 'criminal';
            sniping = true; // Citizens try to snipe criminal leader to steal back victory
          } else if (citizenWins >= 3) {
            nextPhase = 'game_over';
            nextWinner = 'citizen';
            sniping = true; // Criminals try to snipe citizen leader
          } else {
            // Next round
            return {
              ...prev,
              roundsHistory: newHistory,
              consecutiveRejections: 0,
              currentRound: prev.currentRound + 1,
              currentProposal: [],
              phase: 'round_proposal',
              currentPresidentOrderIndex: (prev.currentPresidentOrderIndex + 1) % players.length,
            };
          }

          return {
            ...prev,
            roundsHistory: newHistory,
            consecutiveRejections: 0,
            currentProposal: [],
            phase: nextPhase,
            winnerTeam: nextWinner,
            assassinationStage: sniping,
            currentPresidentOrderIndex: (prev.currentPresidentOrderIndex + 1) % players.length,
          };

        } else {
          // Simply pass to next president
          return {
            ...prev,
            consecutiveRejections: nextRejections,
            currentProposal: [],
            phase: 'round_proposal',
            currentPresidentOrderIndex: (prev.currentPresidentOrderIndex + 1) % players.length,
          };
        }
      });

      const nextPresName = players[juryPresidentOrder[(currentPresidentOrderIndex + 1) % players.length]]?.name;
      addLog('인준투표', `배심원단 제안이 부결되었습니다. (찬성: ${inputCount}표). 부결 누적: ${consecutiveRejections + 1}/5. 배심원장 권한이 ${nextPresName}에게 양도됩니다.`);
    }
  };

  // Secret ballot processing
  const handleRegisterSecretVote = (vote: 'guilty' | 'innocent') => {
    if (activeVoterIndex === null) return;
    const voterPlayerIndex = currentProposal[activeVoterIndex];

    onUpdateState(prev => {
      const copyStatus = { ...prev.votedStatus };
      copyStatus[voterPlayerIndex] = true;

      return {
        ...prev,
        votedStatus: copyStatus,
        currentSecretVotes: [...prev.currentSecretVotes, vote],
      };
    });

    setVoteSubPhase('feedback');
  };

  const handleNextVoter = () => {
    if (activeVoterIndex === null) return;
    
    if (activeVoterIndex < currentProposal.length - 1) {
      // Go to next voter
      onUpdateState(prev => ({
        ...prev,
        activeVoterIndex: (prev.activeVoterIndex ?? 0) + 1,
      }));
      setVoteSubPhase('blind');
    } else {
      // Everyone voted! Trigger Results Analysis stage
      onUpdateState(prev => ({
        ...prev,
        activeVoterIndex: null,
      }));
      handleCompleteSecretBallots();
    }
  };

  const handleCompleteSecretBallots = () => {
    onUpdateState(prev => {
      // Calculate results
      const guiltyCount = prev.currentSecretVotes.filter(v => v === 'guilty').length;
      const innocentCount = prev.currentSecretVotes.filter(v => v === 'innocent').length;
      
      // Determination rules:
      // Citizens win (Guilty verdict) only if unanimous guilty.
      // Exception: Round 4 allows 1 innocent vote.
      let resultWinner: 'citizen' | 'criminal' = 'criminal';
      if (prev.currentRound === 4) {
        if (innocentCount <= 1) {
          resultWinner = 'citizen';
        }
      } else {
        if (innocentCount === 0) {
          resultWinner = 'citizen';
        }
      }

      // Shuffling votes to protect absolute anonymity
      const shuffledVotes = [...prev.currentSecretVotes].sort(() => Math.random() - 0.5);

      const roundRes: RoundResult = {
        round: prev.currentRound,
        juryPresidentIndex: prev.juryPresidentOrder[prev.currentPresidentOrderIndex],
        juryMembers: [...prev.currentProposal],
        approveVotes: prev.proposalApproveCount,
        isApproved: true,
        guiltyVotes: guiltyCount,
        innocentVotes: innocentCount,
        result: resultWinner,
      };

      return {
        ...prev,
        currentSecretVotes: shuffledVotes, // overwrite with shuffled
        roundsHistory: [...prev.roundsHistory, roundRes],
        phase: 'ballot_result',
      };
    });

    addLog('비밀재판', `배심원단 투표가 종료되었습니다. 판결 결과를 확인 중입니다.`);
  };

  // Verdict next steps
  const handleProceedAfterVerdict = () => {
    // Check if either team reached 3 wins
    const history = [...roundsHistory];
    const citizenWins = history.filter(h => h.result === 'citizen').length;
    const criminalWins = history.filter(h => h.result === 'criminal').length;

    if (citizenWins >= 3) {
      // Citizen team won trials. Criminal team snipes.
      onUpdateState(prev => ({
        ...prev,
        phase: 'game_over',
        winnerTeam: 'citizen',
        assassinationStage: true,
      }));
      addLog('재판종료', '시민 팀이 재판에서 3승을 달성했습니다. 범죄자 리더의 저격 단계가 개시됩니다.');
    } else if (criminalWins >= 3) {
      // Criminal team won trials. Citizen team snipes.
      onUpdateState(prev => ({
        ...prev,
        phase: 'game_over',
        winnerTeam: 'criminal',
        assassinationStage: true,
      }));
      addLog('재판종료', '범죄자 팀이 재판에서 3승을 달성했습니다. 시민 리더의 저격 단계가 개시됩니다.');
    } else {
      // Proceed to next round
      onUpdateState(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        consecutiveRejections: 0,
        currentProposal: [],
        phase: 'round_proposal',
        currentPresidentOrderIndex: (prev.currentPresidentOrderIndex + 1) % players.length,
      }));
      addLog('시스템', `제 ${currentRound + 1}차 재판 준비 단계로 진입합니다.`);
    }
  };

  // Sniper assassination resolve
  const handleConfirmAssassination = () => {
    if (selectedSniperTarget === null) return;
    const target = players[selectedSniperTarget];
    
    // Check if target is correct leader
    let success = false;
    let correctLeaderName = '';

    if (winnerTeam === 'citizen') {
      // Criminals sniping citizen leader
      const leader = players.find(p => p.role === Role.CITIZEN_LEADER);
      success = target.role === Role.CITIZEN_LEADER;
      correctLeaderName = leader ? leader.name : '';
    } else {
      // Citizens sniping criminal leader
      const leader = players.find(p => p.role === Role.CRIMINAL_LEADER);
      success = target.role === Role.CRIMINAL_LEADER;
      correctLeaderName = leader ? leader.name : '';
    }

    onUpdateState(prev => ({
      ...prev,
      assassinationTargetIndex: selectedSniperTarget,
      assassinationSuccess: success,
      assassinationStage: false,
      finalWinner: success
        ? (prev.winnerTeam === 'citizen' ? 'criminal' : 'citizen') // Reversed!
        : prev.winnerTeam, // Standard winner wins!
    }));

    if (success) {
      addLog('저격결과', `리더 저격 성공! 지목한 [${target.name}]은(는) 진짜 리더였습니다! 패배 팀이 대역전극을 완성하여 최종 승리합니다!`);
    } else {
      addLog('저격결과', `리더 저격 실패! 지목한 [${target.name}]은(는) 리더가 아니었습니다. (진짜 리더: ${correctLeaderName}). 승리 팀이 최종 승리를 굳힙니다.`);
    }
  };

  const handleRestart = () => {
    onUpdateState(() => ({
      players: [],
      rolesAssigned: false,
      currentRound: 1,
      phase: 'setup',
      juryPresidentOrder: [],
      currentPresidentOrderIndex: 0,
      consecutiveRejections: 0,
      currentProposal: [],
      proposalApproveCount: 0,
      votedStatus: {},
      currentSecretVotes: [],
      activeVoterIndex: null,
      roundsHistory: [],
      winnerTeam: null,
      assassinationStage: false,
      assassinationTargetIndex: null,
      assassinationSuccess: null,
      finalWinner: null,
      logs: [],
    }));
  };

  const phaseNames: { [key: string]: string } = {
    setup: '게임 준비',
    identity_check: '정체 확인',
    president_order: '배심원장 순서 결정',
    round_proposal: '배심원단 후보 추천',
    proposal_vote: '배심원단 추천 인준 처리',
    secret_ballot: '비밀투표',
    ballot_result: '투표 결과',
    game_over: '게임 종료'
  };

  // Render individual control interfaces depending on Phase
  return (
    <div className="bg-[#0f111a] border border-gold-900/30 rounded-2xl p-5 shadow-xl space-y-6 h-full flex flex-col justify-between">
      
      {/* Step Header */}
      <div>
        {juryWarning && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-600 border border-red-400 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-2xl z-50 animate-bounce">
            ⚠️ {juryWarning}
          </div>
        )}

        <div className="flex justify-between items-center border-b border-gold-900/20 pb-3 mb-4">
          <span className="text-[11px] font-mono text-gold-500 font-bold uppercase tracking-wider">
            교사 운영 페이지
          </span>
          <span className="text-xs bg-gold-950 border border-gold-800 text-gold-400 font-bold px-2.5 py-1 rounded font-sans">
            {phaseNames[phase] || phase.toUpperCase()}
          </span>
        </div>

        {/* Round Status Track for Teacher Console */}
        {phase !== 'setup' && (
          <div className="flex justify-between items-center bg-[#0a0a0f] border border-gold-950/40 p-3.5 rounded-xl mb-6 text-xs">
            <span className="font-extrabold text-gold-500">라운드별 진행 현황</span>
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
                    className={`w-14 py-1.5 rounded text-center text-xs font-sans font-black transition-all flex flex-col justify-center items-center ${
                      isPassed
                        ? isPassed.result === 'citizen'
                          ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                          : 'bg-red-950 border border-red-500 text-red-400'
                        : isCurrent
                        ? 'bg-gold-500 text-black font-extrabold shadow shadow-gold-500/50 animate-pulse'
                        : 'bg-black/60 border border-gray-800 text-gray-600'
                    }`}
                  >
                    <span className="text-[9px] block">R{r}</span>
                    <span className="text-[9px] font-bold block mt-0.5">{verdictText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase Controls */}
        {phase === 'president_order' && (
          <div id="teacher-president-order" className="space-y-4 py-4 text-center">
            <h4 className="text-sm font-bold text-gray-300">배심원장 순서 무작위 결정</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              본 게임 진행에 앞서, 배심원단 지정을 주도할 배심원장 순서를 무작위로 추첨합니다. 아래 버튼을 눌러 스크린에 결과를 공개하세요.
            </p>
            
            {isGeneratingOrder ? (
              <div className="py-6 space-y-3">
                <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-gold-400 font-bold tracking-wider animate-pulse">배심원장 순서 셔플 중...</p>
                <div className="flex justify-center gap-1.5 overflow-hidden max-w-xs mx-auto opacity-50">
                  {tempJuryOrder.slice(0, 4).map((idx, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-900 border border-gray-800 text-[10px] text-gray-500 rounded">
                      {players[idx]?.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <button
                id="generate-president-order-btn"
                onClick={handleGeneratePresidentOrder}
                className="px-6 py-3 bg-gold-600 text-black font-extrabold text-xs rounded hover:bg-gold-500 transition shadow shadow-gold-950/20 flex items-center gap-1.5 mx-auto"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> 배심원장 순서 결정 및 게임 개시
              </button>
            )}
          </div>
        )}

        {phase === 'round_proposal' && currentPresident && (
          <div id="teacher-round-proposal" className="space-y-4">
            <div className="bg-black/40 border border-gold-950 p-3 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-400 block">현재 배심원장</span>
                <span className="font-bold text-gold-400 text-sm">{currentPresident.name}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">배심원 배정 인원</span>
                <span className="font-mono font-bold text-gold-300 text-sm">{currentProposal.length} / {jurySize} 명</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-semibold block">
                배심원장이 호명한 학생들을 터치하여 선택하세요 (정원: {jurySize}명)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {players.map((p, idx) => {
                  const isSelected = currentProposal.includes(idx);
                  return (
                    <button
                      key={p.id}
                      id={`nominate-candidate-btn-${idx}`}
                      onClick={() => handleToggleNominee(idx)}
                      className={`py-2 px-3 rounded-xl border transition-all flex items-center gap-3 shadow relative h-14 ${
                        isSelected
                          ? 'bg-gold-950/40 border-gold-500 text-gold-300 font-bold scale-[1.02] ring-1 ring-gold-500/50 shadow-gold-950'
                          : 'bg-[#0d0e14]/50 border-gray-900 text-gray-300 hover:border-gray-800 hover:bg-[#11131c]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-gold-500 text-black rounded-full p-0.5 shadow-md z-10">
                          <Check className="w-2.5 h-2.5 stroke-[4]" />
                        </div>
                      )}
                      <PlayerAvatar index={idx} className="w-8 h-8 flex-shrink-0" />
                      <span className="text-xs font-black tracking-wide text-gray-200 truncate pr-2">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="confirm-proposal-btn"
              onClick={handleConfirmProposal}
              disabled={currentProposal.length !== jurySize}
              className={`w-full py-6 rounded-2xl text-2xl font-black tracking-wider uppercase transition flex items-center justify-center gap-2 ${
                currentProposal.length === jurySize
                  ? 'bg-gold-600 text-black hover:bg-gold-500 shadow-lg scale-[1.01] active:scale-[0.99]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              배심원단 추천 확정 및 투표 개시 <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        )}

        {phase === 'proposal_vote' && currentPresident && (
          <div id="teacher-proposal-vote" className="space-y-5 py-2">
            <div className="bg-[#0c0d12] border border-gold-900/40 p-5 rounded-xl space-y-3 shadow-md">
              <p className="text-gold-500 font-black text-sm uppercase tracking-wider text-center">제안된 배심원 후보 명단</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-1 justify-center">
                {currentProposal.map(idx => (
                  <div key={idx} className="flex flex-col items-center p-3 bg-gold-950/20 border border-gold-500/30 rounded-xl text-center space-y-1.5 shadow-md">
                    <PlayerAvatar index={idx} className="w-10 h-10" />
                    <span className="text-sm font-black text-gold-300 tracking-wide">{players[idx]?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/30 border border-gray-800 rounded-xl p-6 text-center space-y-4">
              <p className="text-2xl font-black text-gray-200">
                📢 배심원단 추천 인준 거수투표
              </p>
              <p className="text-lg text-gray-300 leading-relaxed font-semibold">
                제안된 배심원 후보 명단 내용을 검토하고,<br />
                교실 전체 학생들의 <span className="text-gold-400 font-extrabold underline decoration-gold-500">거수 투표</span>를 통해 배심원 인준 여부를 최종 결정해주세요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-3">
              <button
                id="reject-proposal-btn"
                onClick={() => handleClassVoteSubmit(false, 0)}
                className="py-10 bg-red-950/40 border-2 border-red-800/60 hover:bg-red-900 hover:border-red-500 text-red-300 hover:text-white text-xl font-black rounded-xl transition shadow-lg transform active:scale-95 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">❌ 부결 처리</span>
                <span className="text-xs font-bold opacity-85 mt-1">배심원장 순서 양도</span>
              </button>
              <button
                id="approve-proposal-btn"
                onClick={() => handleClassVoteSubmit(true, Math.ceil(players.length / 2))}
                className="py-10 bg-emerald-950/40 border-2 border-emerald-600 hover:bg-emerald-900 hover:border-emerald-500 text-emerald-300 hover:text-white text-xl font-black rounded-xl transition shadow-lg transform active:scale-95 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">⭕ 가결 처리</span>
                <span className="text-xs font-bold opacity-85 mt-1">비밀 재판 개시</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'secret_ballot' && activeVoterIndex !== null && (
          <div id="teacher-secret-ballot" className="space-y-6">
            {/* Stage: Blind (Teacher screen blocked before student comes) */}
            {voteSubPhase === 'blind' && (
              <div className="text-center py-10 bg-black/40 border border-gold-950 rounded-2xl space-y-6 max-w-4xl mx-auto">
                <div className="p-4 bg-gold-950/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-gold-400 animate-pulse">
                  <EyeOff className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-gold-400">비밀 투표용 가림막 활성화</p>
                  <p className="text-2xl text-gray-200 leading-relaxed font-bold max-w-2xl mx-auto mt-4">
                    배심원 <span className="text-gold-400 font-extrabold underline">[{players[currentProposal[activeVoterIndex]]?.name}]</span>을(를) 교사용 컴퓨터 앞으로 부르고, 비밀 투표를 진행하세요.
                  </p>
                </div>
                <button
                  id="voter-open-ballot-btn"
                  onClick={() => setVoteSubPhase('voting')}
                  className="w-full max-w-lg mx-auto py-12 px-8 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-black text-2xl rounded-2xl transition shadow-2xl hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 mt-6"
                >
                  <Eye className="w-8 h-8 stroke-[3]" /> 투표 화면 열기 (CLICK)
                </button>
              </div>
            )}

            {/* Stage: Voting (Student secretly logs guilty/innocent) */}
            {voteSubPhase === 'voting' && (
              <div className="p-8 bg-[#090a0f] border-2 border-gold-900/40 rounded-2xl text-center min-h-[450px] flex flex-col justify-between shadow-2xl animate-fade-in max-w-4xl mx-auto">
                <div>
                  <span className="text-[11px] font-mono text-gold-500 font-black uppercase tracking-widest block">PRIVATE JURY BALLOT</span>
                  <p className="font-extrabold text-white text-3xl mt-4">
                    배심원 {players[currentProposal[activeVoterIndex]]?.name} 투표하세요
                  </p>
                  <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-semibold max-w-2xl mx-auto mt-3">
                    투표 결과는 비밀로 해주세요.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 my-6">
                  <button
                    id="vote-guilty-btn"
                    onClick={() => handleRegisterSecretVote('guilty')}
                    className="py-20 bg-gradient-to-b from-emerald-950/50 to-emerald-900/70 border-3 border-emerald-500 hover:border-emerald-300 text-emerald-300 font-display font-black text-2xl rounded-2xl shadow-xl hover:shadow-emerald-950/50 transition transform hover:scale-[1.03] active:scale-95 flex flex-col items-center justify-center gap-2"
                  >
                    <Award className="w-12 h-12 text-emerald-400" />
                    <span>유죄 (GUILTY)</span>
                  </button>
                  <button
                    id="vote-innocent-btn"
                    onClick={() => handleRegisterSecretVote('innocent')}
                    className="py-20 bg-gradient-to-b from-red-950/50 to-red-900/70 border-3 border-red-500 hover:border-red-300 text-red-300 font-display font-black text-2xl rounded-2xl shadow-xl hover:shadow-red-950/50 transition transform hover:scale-[1.03] active:scale-95 flex flex-col items-center justify-center gap-2"
                  >
                    <Skull className="w-12 h-12 text-red-400" />
                    <span>무죄 (INNOCENT)</span>
                  </button>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  * 투표 즉시 다음 대기 화면이 가동되므로 절대 다른 학생에게 정보가 노출되지 않습니다.
                </div>
              </div>
            )}

            {/* Stage: Feedback (Success confirmation mask, ready to shift) */}
            {voteSubPhase === 'feedback' && (
              <div className="text-center py-10 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl space-y-6 max-w-4xl mx-auto animate-fade-in">
                <div className="p-4 bg-emerald-950/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-emerald-400">투표 접수 완료! (CONFIRMED)</p>
                  <p className="text-2xl text-gray-200 leading-relaxed font-bold max-w-2xl mx-auto mt-4">
                    투표가 안전하게 기록되었습니다. 다음 학생이 투표 선택 항목을 보지 못하도록 즉시 아래 버튼을 클릭하여 화면을 가려주세요.
                  </p>
                </div>
                <button
                  id="voter-next-step-btn"
                  onClick={handleNextVoter}
                  className="w-full max-w-lg mx-auto py-12 px-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-2xl rounded-2xl transition shadow-2xl hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 mt-6"
                >
                  <EyeOff className="w-8 h-8 stroke-[3]" /> 다음 배심원 투표 가림막 켜기
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'ballot_result' && (
          <div id="teacher-ballot-result" className="space-y-6 max-w-4xl mx-auto">
            <div className="p-6 bg-black/60 border border-gold-950 rounded-2xl space-y-4 shadow-xl">
              <span className="text-lg font-mono text-gold-500 font-black block uppercase tracking-wider mb-2 text-center">
                실시간 집계 분석 (결과 확인)
              </span>
              <div className="grid grid-cols-2 gap-6 text-center py-2">
                <div className="bg-emerald-950/10 p-6 border border-emerald-900/20 rounded-xl">
                  <span className="text-sm text-emerald-400 block font-mono font-bold mb-1">유죄 표수</span>
                  <span className="text-5xl font-extrabold font-display text-emerald-300">
                    {roundsHistory.find(h => h.round === currentRound)?.guiltyVotes}표
                  </span>
                </div>
                <div className="bg-red-950/10 p-6 border border-red-900/20 rounded-xl">
                  <span className="text-sm text-red-400 block font-mono font-bold mb-1">무죄 표수</span>
                  <span className="text-5xl font-extrabold font-display text-red-300">
                    {roundsHistory.find(h => h.round === currentRound)?.innocentVotes}표
                  </span>
                </div>
              </div>
              <p className="text-2xl text-gray-200 text-center font-black mt-4">
                최종 결과: {roundsHistory.find(h => h.round === currentRound)?.result === 'citizen' ? (
                  <span className="text-emerald-400 underline decoration-emerald-500/50">유죄 선고 (시민 승리)</span>
                ) : (
                  <span className="text-red-400 underline decoration-red-500/50">무죄 선고 (범죄자 승리)</span>
                )}
              </p>
            </div>

            <button
              id="proceed-after-verdict-btn"
              onClick={handleProceedAfterVerdict}
              className="w-full py-12 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-black text-3xl rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition tracking-wider flex items-center justify-center gap-3 font-display"
            >
              라운드 종료 및 결과 확정하기
            </button>
          </div>
        )}

        {phase === 'game_over' && (
          <div id="teacher-game-over" className="space-y-4">
            {assassinationStage ? (
              <div className="space-y-4">
                <div className="bg-[#0f0b0c] border-2 border-red-500/50 p-5 rounded-2xl shadow-xl animate-pulse">
                  <h4 className="text-xl font-black text-red-500 flex items-center justify-center gap-1.5 font-sans">
                    🎯 최종 미션! 리더를 찾아라
                  </h4>
                  <p className="text-xs text-gray-200 leading-relaxed mt-2.5 text-center">
                    {winnerTeam === 'citizen' ? (
                      <span>패배한 <span className="text-red-400 font-extrabold text-sm underline decoration-red-500">범죄자 리더</span>는 시민 팀의 <span className="text-gold-400 font-extrabold text-sm underline decoration-gold-500">시민 리더</span>를 지목하세요. 맞추면 범죄자의 대역전승!</span>
                    ) : (
                      <span>패배한 <span className="text-gold-400 font-extrabold text-sm underline decoration-gold-500">시민 리더</span>는 범죄자 팀의 <span className="text-red-400 font-extrabold text-sm underline decoration-red-500">범죄자 리더</span>를 지목하세요. 맞추면 시민의 대역전승!</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-red-400 font-bold tracking-wider block uppercase font-sans">🔥 리더 지목 저격하기!</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {players.map((p, idx) => {
                      const isSelected = selectedSniperTarget === idx;
                      return (
                        <button
                          key={p.id}
                          id={`sniper-target-btn-${idx}`}
                          onClick={() => setSelectedSniperTarget(idx)}
                          className={`aspect-[3/4] p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 shadow relative ${
                            isSelected
                              ? 'bg-red-950/40 border-red-500 text-red-300 font-bold scale-[1.02] ring-1 ring-red-500/50 shadow-red-950'
                              : 'bg-[#0d0e14]/50 border-gray-900 text-gray-300 hover:border-gray-800 hover:bg-[#11131c]'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-0.5 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[4]" />
                            </div>
                          )}
                          <PlayerAvatar index={idx} className="w-12 h-12" />
                          <span className="text-xs font-black tracking-wide text-gray-200 mt-1 line-clamp-1">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  id="confirm-assassination-btn"
                  onClick={handleConfirmAssassination}
                  disabled={selectedSniperTarget === null}
                  className={`w-full py-4 rounded-xl text-xs font-extrabold tracking-widest uppercase transition ${
                    selectedSniperTarget !== null
                      ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  최종 저격 격발 (CONFIRM SNIPE)
                </button>
              </div>
            ) : (
              // Game ended fully
              <div className="text-center py-6 space-y-8 animate-fade-in relative overflow-hidden">
                {/* Floating Confetti / Particles Animation */}
                <div className="absolute inset-0 pointer-events-none flex justify-around items-center opacity-40 select-none">
                  <span className="text-4xl animate-bounce duration-1000">🎉</span>
                  <span className="text-4xl animate-bounce duration-700">✨</span>
                  <span className="text-4xl animate-bounce duration-900">🏆</span>
                  <span className="text-4xl animate-bounce duration-1200">⭐</span>
                  <span className="text-4xl animate-bounce duration-800">🎉</span>
                </div>

                <div className="bg-gradient-to-b from-[#11131c] to-black/60 border-2 border-gold-500 p-8 rounded-2xl space-y-6 shadow-2xl relative">
                  
                  <div className="space-y-2 pt-2">
                    <p className="text-sm text-gray-400 uppercase font-bold tracking-widest">🏆 시나리오 최종 승자 🏆</p>
                    <p className={`text-6xl sm:text-7xl font-black font-display tracking-wider drop-shadow-lg py-4 ${
                      finalWinner === 'citizen' ? 'text-gold-400 animate-pulse' : 'text-red-500 animate-pulse'
                    }`}>
                      {finalWinner === 'citizen' ? '시민 팀' : '범죄자 팀'}
                    </p>
                  </div>
                </div>

                <button
                  id="restart-game-btn"
                  onClick={handleRestart}
                  className="w-full max-w-md py-9 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-black text-2xl rounded-2xl shadow-2xl hover:scale-[1.03] active:scale-95 transition tracking-widest font-display mx-auto block"
                >
                  🔄 새로운 게임 시작하기
                </button>

                <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto pt-4 border-t border-gray-900/40">
                  모든 과정이 끝났습니다. 우측 하단의 <span className="text-gold-500 font-bold">[관리자 로그]</span> 버튼을 누르면 전체 라운드의 디테일한 세부 내역을 조회 및 다운로드하여 수업 피드백을 진행할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual / Help Footer */}
      <div className="border-t border-gold-900/20 pt-4 flex justify-between items-center text-xs text-gray-500">
        <button
          id="teacher-help-btn"
          onClick={onOpenManual}
          className="flex items-center gap-1 text-gold-500/80 hover:text-gold-400 transition"
        >
          <HelpCircle className="w-4 h-4" /> 가이드
        </button>
      </div>

      {/* Random Sequencing Result Popup */}
      {showOrderPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-50 p-4 animate-fade-in">
          <div className="bg-[#0b0c11] border-2 border-gold-500/70 rounded-2xl p-6 max-w-4xl w-full space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-1">
              <span className="text-xs font-mono tracking-widest text-gold-500 uppercase font-bold">DRAW RESULT</span>
              <h3 className="text-2xl font-black text-white">🎉 배심원장 순서 확정 🎉</h3>
              <p className="text-xs text-gray-400">
                무작위 셔플을 통해 매 라운드 추천권을 가질 배심원장 순서가 결정되었습니다.
              </p>
            </div>

            <div className="bg-black/60 border border-gold-950 rounded-xl p-6 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tempJuryOrder.map((playerIdx, orderIdx) => {
                  const p = players[playerIdx];
                  return (
                    <div
                      key={orderIdx}
                      className="flex flex-col items-center justify-between p-4 bg-gradient-to-b from-gold-950/20 to-black/50 border border-gold-900/30 rounded-xl text-center shadow-md animate-fade-in"
                    >
                      <span className="font-mono text-xs font-black text-gold-500 mb-2">#{orderIdx + 1}</span>
                      <PlayerAvatar index={playerIdx} className="w-10 h-10 mb-2" />
                      <span className="font-extrabold text-xs text-gray-200 line-clamp-1">{p?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              id="confirm-sequence-start-btn"
              onClick={handleStartGameWithOrder}
              className="w-full max-w-md mx-auto py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black text-xs font-black rounded-xl transition shadow-lg shadow-gold-950/50"
            >
              확인 및 게임 시작
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
