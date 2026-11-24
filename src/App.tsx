import { useState, useEffect, useRef, useTransition } from 'react';
import { GameState, Role, Player } from './types';
import MainScreen from './components/MainScreen';
import SetupView from './components/SetupView';
import IdentityCheckView from './components/IdentityCheckView';
import TeacherConsole from './components/TeacherConsole';
import ProjectorDisplay from './components/ProjectorDisplay';
import InstructionModal from './components/InstructionModal';
import AdminLogModal from './components/AdminLogModal';
import IntroModal from './components/IntroModal';
import { Monitor, HelpCircle, ShieldAlert, Layout, Eye, Copy, Check, Skull } from 'lucide-react';
import { createProjectorId, createRoomCode, JuryHostNetwork, JuryProjectorNetwork, type JuryNetworkStatus } from './network';

const initialGameState: GameState = {
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
  activeCheckIndex: null
};

export const ROLE_COUNTS: { [key: number]: { citizen: number; criminal: number } } = {
  5: { citizen: 3, criminal: 2 },
  6: { citizen: 4, criminal: 2 },
  7: { citizen: 4, criminal: 3 },
  8: { citizen: 5, criminal: 3 },
  9: { citizen: 5, criminal: 4 },
  10: { citizen: 6, criminal: 4 },
  11: { citizen: 7, criminal: 4 },
  12: { citizen: 7, criminal: 5 },
  13: { citizen: 8, criminal: 5 },
  14: { citizen: 8, criminal: 6 },
  15: { citizen: 9, criminal: 6 }
};

export default function App() {
  // Check if we are running in the standalone Projector tab
  const projectorMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'projector';
  const [isProjectorOnlyTab] = useState(projectorMode);
  const [roomCode] = useState(() => {
    const queryRoom = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room')?.toUpperCase() : '';
    if (queryRoom) return queryRoom;
    if (projectorMode) return '';
    return sessionStorage.getItem('jury_game_room') || createRoomCode();
  });
  const networkRef = useRef<JuryHostNetwork | null>(null);
  const [networkStatus, setNetworkStatus] = useState<JuryNetworkStatus>('connecting');
  const [networkMessage, setNetworkMessage] = useState('');
  const [showMainScreen, setShowMainScreen] = useState(true);

  // Central Game State synced via localstorage & BroadcastChannel
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const storageKey = projectorMode && roomCode ? `jury_game_state_${roomCode}` : 'jury_game_state';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return initialGameState;
        }
      }
    }
    return initialGameState;
  });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isProjectorOnlyTab) {
      if (!roomCode) return;
      let projectorId: string = createProjectorId();
      try {
        const key = `jury_projector_id_${roomCode}`;
        projectorId = sessionStorage.getItem(key) || projectorId;
        sessionStorage.setItem(key, projectorId);
      } catch { /* A temporary ID is sufficient for this tab. */ }
      const network = new JuryProjectorNetwork(
        roomCode,
        projectorId,
        state => {
          setNetworkMessage('');
          startTransition(() => setGameState(state));
          try { localStorage.setItem(`jury_game_state_${roomCode}`, JSON.stringify(state)); } catch { /* State remains in memory. */ }
        },
        (status, message) => { setNetworkStatus(status); setNetworkMessage(message ?? ''); },
      );
      network.connect();
      return () => network.disconnect();
    }
    sessionStorage.setItem('jury_game_room', roomCode);
    const network = new JuryHostNetwork(roomCode, gameState, message => console.warn(message));
    networkRef.current = network;
    network.connect();
    return () => {
      network.disconnect();
      if (networkRef.current === network) networkRef.current = null;
    };
  }, [isProjectorOnlyTab, roomCode]);

  // Layout mode for the Teacher's primary tab
  const [layoutMode, setLayoutMode] = useState<'split' | 'teacher_only' | 'projector_only'>('teacher_only');

  // Modals visibility
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAdminLogOpen, setIsAdminLogOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showActivationAlert, setShowActivationAlert] = useState(false);

  // Show activation alert if we load or transition into identity_check and haven't acknowledged it yet
  useEffect(() => {
    if (gameState.phase === 'identity_check' && !isProjectorOnlyTab) {
      const acknowledged = sessionStorage.getItem('activation_alert_acknowledged');
      if (!acknowledged) {
        setShowActivationAlert(true);
      }
    } else {
      setShowActivationAlert(false);
    }
  }, [gameState.phase, isProjectorOnlyTab]);

  // Sync state changes with localStorage & BroadcastChannel
  const updateGameState = (newState: GameState | ((prev: GameState) => GameState)) => {
    setGameState(prev => {
      const resolved = typeof newState === 'function' ? newState(prev) : newState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jury_game_state', JSON.stringify(resolved));
        networkRef.current?.updateState(resolved);
        // Broadcast to other tabs immediately
        try {
          const channel = new BroadcastChannel('jury_game_channel');
          channel.postMessage({ type: 'STATE_UPDATE', state: resolved });
          channel.close();
        } catch (e) {
          // Fallback if BroadcastChannel fails
        }
      }
      return resolved;
    });
  };

  // Listen for BroadcastChannel updates from the controller tab
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('jury_game_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
          startTransition(() => {
            setGameState(event.data.state);
          });
        }
      };
      
      // Also listen to storage events as a reliable multi-tab fallback
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'jury_game_state' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            startTransition(() => {
              setGameState(parsed);
            });
          } catch (err) {}
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        channel.close();
        window.removeEventListener('storage', handleStorageChange);
      };
    } catch (e) {
      return () => {};
    }
  }, []);

  // Set up roles and logs
  const handleStartGame = (playerNames: string[]) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('activation_alert_acknowledged');
    }
    const count = playerNames.length;
    const distribution = ROLE_COUNTS[count] || { citizen: Math.ceil(count * 7 / 12), criminal: Math.floor(count * 5 / 12) };

    const roles: Role[] = [];
    roles.push(Role.CITIZEN_LEADER);
    for (let i = 0; i < distribution.citizen - 1; i++) {
      roles.push(Role.CITIZEN);
    }
    roles.push(Role.CRIMINAL_LEADER);
    for (let i = 0; i < distribution.criminal - 1; i++) {
      roles.push(Role.CRIMINAL);
    }

    // Fisher-Yates Shuffle for roles (perfectly uniform randomness)
    const shuffledRoles = [...roles];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledRoles[i];
      shuffledRoles[i] = shuffledRoles[j];
      shuffledRoles[j] = temp;
    }

    const mappedPlayers: Player[] = playerNames.map((name, idx) => ({
      id: `player-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      role: shuffledRoles[idx],
    }));

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    
    updateGameState({
      ...initialGameState,
      players: mappedPlayers,
      rolesAssigned: true,
      phase: 'identity_check',
      logs: [
        {
          timestamp: timeStr,
          category: '시스템',
          message: `게임 준비 완료. 플레이어 수: ${count}명 (시민: ${distribution.citizen}명, 범죄자: ${distribution.criminal}명). 비밀 정체 확인 단계를 개시합니다.`
        }
      ]
    });
  };

  const handleOpenProjectorWindow = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin + window.location.pathname + `?view=projector&room=${roomCode}`;
      window.open(url, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no');
    }
  };

  const handleCopyProjectorLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin + window.location.pathname + `?view=projector&room=${roomCode}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [showManualNotice, setShowManualNotice] = useState(false);

  const handleOpenAdminLog = () => {
    setIsAdminLogOpen(true);
  };

  const handleResetToMain = () => {
    updateGameState(initialGameState);
    setShowMainScreen(true);
    setIsIntroOpen(false);
    setIsExitConfirmOpen(false);
    setShowManualNotice(false);
  };

  // 1. If this is a dedicated Projector Only Tab, hide all headers and controls. Just render the ProjectorDisplay
  if (isProjectorOnlyTab) {
    return (
      <div className="min-h-screen bg-black text-gray-100 p-6 flex flex-col justify-between select-none">
        {!roomCode ? <div className="projector-network-notice error"><b>학급 코드가 없습니다.</b><span>교사 운영 페이지의 새 창 열기 버튼을 이용해 주세요.</span></div> : networkStatus !== 'connected' && <div className={`projector-network-notice ${networkStatus}`}><b>교사 화면 연결 중</b><span>{networkMessage || `학급 코드 ${roomCode}의 게임을 불러오고 있습니다.`}</span></div>}
        <div className="flex-1">
          <ProjectorDisplay gameState={gameState} />
        </div>
      </div>
    );
  }

  // 2. Main Workspace (with teacher console, options, split layouts)
  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-gray-100 relative selection:bg-gold-500 selection:text-black">
      
      {/* Teacher Workspace Header */}
      <header className="bg-[#0b0c10] border-b border-gold-900/30 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 select-none">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-950/40 rounded-xl border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-base tracking-widest text-gold-400 uppercase">
              지니어스한 학급 놀이 배심원 게임
            </h1>
            <p className="text-[10px] font-mono tracking-wider text-gray-500">
              TEACHER CONTROL PANEL & PRESENTATION HUD
            </p>
          </div>
        </div>

        {/* Right-aligned Header Controls */}
        <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
          {/* Layout controllers and screen separation tools */}
          {gameState.phase !== 'setup' && (
            <div className="flex items-center gap-2">
              <button
                id="layout-teacher-btn"
                onClick={() => setLayoutMode('teacher_only')}
                className={`px-3.5 py-1.5 text-xs rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'teacher_only' ? 'bg-gold-600 border-gold-600 text-black font-bold shadow-md shadow-gold-950/20' : 'bg-[#0d0e12] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 교사용 운영 페이지
              </button>
              <button
                id="layout-projector-btn"
                onClick={() => {
                  handleOpenProjectorWindow();
                  setLayoutMode('teacher_only');
                }}
                className={`px-3.5 py-1.5 text-xs rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  gameState.phase === 'identity_check'
                    ? 'bg-red-600 border-red-600 hover:bg-red-500 text-white font-extrabold animate-pulse ring-2 ring-red-400 ring-offset-2 ring-offset-black shadow-lg shadow-red-950/50'
                    : 'bg-[#0d0e12] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> 게임 운영 페이지(새 창 열기)
              </button>
            </div>
          )}

          {/* Global Controls & Exit */}
          <div className="flex items-center gap-2">
            {gameState.phase === 'setup' && (
              <button
                id="header-manual-btn"
                onClick={() => {
                  setIsManualOpen(true);
                  setShowManualNotice(false);
                }}
                className={`px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  !showMainScreen
                    ? 'bg-gold-500/20 text-yellow-300 border-2 border-yellow-300 ring-4 ring-gold-400/50 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.8)] font-black'
                    : 'border border-gold-900/40 text-gold-400 hover:text-white hover:border-gold-500'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-yellow-300 animate-bounce" /> 사용 설명서
              </button>
            )}

            {!showMainScreen && (
              <button
                id="header-force-exit-btn"
                onClick={() => setIsExitConfirmOpen(true)}
                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105"
              >
                <Skull className="w-3.5 h-3.5" /> 게임 강제 종료
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-start p-6">
        {gameState.phase === 'setup' ? (
          <div className="flex-1 flex items-center justify-center w-full">
            {showMainScreen ? (
              <MainScreen
                onStartClick={() => setIsIntroOpen(true)}
                onOpenManual={() => setIsManualOpen(true)}
              />
            ) : (
              <SetupView onStartGame={handleStartGame} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-1">
            
            {/* Left/Operator Column */}
            {layoutMode !== 'projector_only' && (
              <div className={`${layoutMode === 'teacher_only' ? 'xl:col-span-12' : 'xl:col-span-5'} flex flex-col`}>
                {gameState.phase === 'identity_check' ? (
                  <IdentityCheckView
                    players={gameState.players}
                    gameState={gameState}
                    onUpdateState={updateGameState}
                    onComplete={() => updateGameState(prev => ({ ...prev, phase: 'president_order', activeCheckIndex: null }))}
                  />
                ) : (
                  <TeacherConsole
                    gameState={gameState}
                    onUpdateState={updateGameState}
                    onOpenManual={() => setIsManualOpen(true)}
                    onResetToMain={handleResetToMain}
                    onRequestExit={() => setIsExitConfirmOpen(true)}
                  />
                )}
              </div>
            )}

            {/* Right/Projector Presentation Column */}
            {layoutMode !== 'teacher_only' && (
              <div className={`${layoutMode === 'projector_only' ? 'xl:col-span-12' : 'xl:col-span-7'} flex flex-col`}>
                <ProjectorDisplay gameState={gameState} onUpdateState={updateGameState} />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Floating Admin Log Button (Bottom Right) - Only visible after game starts */}
      {gameState.phase !== 'setup' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="floating-admin-logs-btn"
            onClick={handleOpenAdminLog}
            className={`px-4 py-3 rounded-full border shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs font-black ${
              gameState.phase === 'game_over'
                ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-gold-500 text-black border-gold-300 ring-4 ring-gold-400 animate-bounce shadow-gold-500/50'
                : 'bg-red-950/90 hover:bg-red-900 text-red-300 hover:text-white border-red-800 shadow-black/80'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>게임 과정 기록 확인</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <InstructionModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      
      <IntroModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        onRequestExit={() => setIsExitConfirmOpen(true)}
        onComplete={() => {
          setIsIntroOpen(false);
          setShowMainScreen(false);
          setShowManualNotice(true);
        }}
      />

      {/* Manual Popover Notice */}
      {showManualNotice && (
        <div className="fixed top-16 right-6 z-[9990] w-84 max-w-[90vw] bg-[#0e1017]/95 border-2 border-gold-400 rounded-2xl p-4 shadow-2xl shadow-gold-500/30 backdrop-blur-md animate-bounce-short space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400 flex items-center justify-center text-gold-400 text-xl font-bold shrink-0 shadow-inner">
              📖
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-gold-300">사용 설명서를 읽어보세요!</h4>
              <p className="text-xs text-gray-200 leading-snug font-medium">
                우측 상단의 <span className="text-gold-400 font-bold">[사용 설명서]</span>를 읽어보시면 원활하게 게임을 진행할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              id="open-manual-notice-btn"
              onClick={() => {
                setIsManualOpen(true);
                setShowManualNotice(false);
              }}
              className="flex-1 py-1.5 bg-gold-500 hover:bg-gold-400 text-black text-xs font-black rounded-lg transition shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> 설명서 열기
            </button>
            <button
              id="confirm-manual-notice-btn"
              onClick={() => setShowManualNotice(false)}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition border border-gray-700 cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <AdminLogModal
        isOpen={isAdminLogOpen}
        onClose={() => setIsAdminLogOpen(false)}
        logs={gameState.logs}
        roundsHistory={gameState.roundsHistory}
        players={gameState.players}
      />

      {/* Custom Confirmation Modal for Force End Game (100% Reliable in iFrame) */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e1017] border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl space-y-6 text-center relative">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-950/60 border border-red-500/60 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50">
              <Skull className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-red-500 tracking-wider">게임 강제 종료</h3>
              <p className="text-lg text-gray-100 font-extrabold leading-snug">
                게임을 종료하고 메인화면으로 이동하시겠습니까?
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                현재 진행 중인 게임 데이터가 초기화되며 초기 메인화면으로 이동합니다.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-exit-btn"
                onClick={() => setIsExitConfirmOpen(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-extrabold rounded-xl transition border border-gray-700 cursor-pointer"
              >
                취소
              </button>
              <button
                id="confirm-exit-btn"
                onClick={handleResetToMain}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold rounded-xl transition shadow-lg shadow-red-950/50 border border-red-400 cursor-pointer"
              >
                확인 (종료)
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivationAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e1017] border-2 border-red-500 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-950/40 border border-red-500/50 flex items-center justify-center text-red-500 animate-bounce">
              <Eye className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-red-500 tracking-wider">알림</h3>
              <p className="text-lg text-gray-100 leading-relaxed font-bold">
                게임 운영 페이지를 활성화 해주세요.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                우측 상단에서 빨갛게 깜빡거리는 <strong className="text-white font-bold">[게임 운영 페이지]</strong> 버튼을 먼저 클릭하여 게임 디스플레이 창을 활성화한 후에 비밀 확인을 진행해 주세요.
              </p>
            </div>
            <button
              id="confirm-activation-btn"
              onClick={() => {
                sessionStorage.setItem('activation_alert_acknowledged', 'true');
                setShowActivationAlert(false);
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition shadow-lg shadow-red-950/50"
            >
              확인
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
