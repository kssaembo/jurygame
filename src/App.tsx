import { useState, useEffect, useTransition } from 'react';
import { GameState, Role, Player } from './types';
import MainScreen from './components/MainScreen';
import SetupView from './components/SetupView';
import IdentityCheckView from './components/IdentityCheckView';
import TeacherConsole from './components/TeacherConsole';
import ProjectorDisplay from './components/ProjectorDisplay';
import InstructionModal from './components/InstructionModal';
import AdminLogModal from './components/AdminLogModal';
import { Monitor, HelpCircle, ShieldAlert, Layout, Eye, Copy, Check } from 'lucide-react';

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
  const [isProjectorOnlyTab, setIsProjectorOnlyTab] = useState(false);
  const [showMainScreen, setShowMainScreen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsProjectorOnlyTab(window.location.search.includes('view=projector'));
    }
  }, []);

  // Central Game State synced via localstorage & BroadcastChannel
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jury_game_state');
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

  // Layout mode for the Teacher's primary tab
  const [layoutMode, setLayoutMode] = useState<'split' | 'teacher_only' | 'projector_only'>('teacher_only');

  // Modals visibility
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAdminLogOpen, setIsAdminLogOpen] = useState(false);
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
      const url = window.location.origin + window.location.pathname + '?view=projector';
      window.open(url, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no');
    }
  };

  const handleCopyProjectorLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin + window.location.pathname + '?view=projector';
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const handleOpenAdminLog = () => {
    setIsAdminLogOpen(true);
  };

  // 1. If this is a dedicated Projector Only Tab, hide all headers and controls. Just render the ProjectorDisplay
  if (isProjectorOnlyTab) {
    return (
      <div className="min-h-screen bg-black text-gray-100 p-6 flex flex-col justify-between select-none">
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

        {/* Layout controllers and screen separation tools */}
        {gameState.phase !== 'setup' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3.5">
              <button
                id="layout-teacher-btn"
                onClick={() => setLayoutMode('teacher_only')}
                className={`px-4 py-2 text-xs rounded-lg border transition flex items-center gap-1.5 ${
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
                className={`px-4 py-2 text-xs rounded-lg border transition flex items-center gap-1.5 ${
                  gameState.phase === 'identity_check'
                    ? 'bg-red-600 border-red-600 hover:bg-red-500 text-white font-extrabold animate-pulse ring-2 ring-red-400 ring-offset-2 ring-offset-black shadow-lg shadow-red-950/50'
                    : 'bg-[#0d0e12] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> 게임 운영 페이지(새 창 열기)
              </button>
            </div>
          </div>
        )}

        {/* Global Manual Trigger */}
        {gameState.phase === 'setup' && (
          <button
            id="header-manual-btn"
            onClick={() => setIsManualOpen(true)}
            className="px-3.5 py-1.5 border border-gold-900/40 text-gold-400 hover:text-white hover:border-gold-500 rounded text-xs flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4" /> 사용 설명서
          </button>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-start p-6">
        {gameState.phase === 'setup' ? (
          <div className="flex-1 flex items-center justify-center w-full">
            {showMainScreen ? (
              <MainScreen
                onStartClick={() => setShowMainScreen(false)}
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
                  />
                )}
              </div>
            )}

            {/* Right/Projector Presentation Column */}
            {layoutMode !== 'teacher_only' && (
              <div className={`${layoutMode === 'projector_only' ? 'xl:col-span-12' : 'xl:col-span-7'} flex flex-col`}>
                <ProjectorDisplay gameState={gameState} />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Floating Admin & Reset Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-admin-logs-btn"
          onClick={handleOpenAdminLog}
          className="p-3 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white rounded-full border border-red-800 shadow-xl shadow-black/80 transition-all duration-300 hover:scale-105 flex items-center gap-2 group text-xs font-bold"
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            관리자 모드 (로그/초기화)
          </span>
        </button>
      </div>

      {/* Modals */}
      <InstructionModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      
      <AdminLogModal
        isOpen={isAdminLogOpen}
        onClose={() => setIsAdminLogOpen(false)}
        logs={gameState.logs}
        roundsHistory={gameState.roundsHistory}
        players={gameState.players}
      />

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
