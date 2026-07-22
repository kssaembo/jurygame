import { useState } from 'react';
import { X, ShieldAlert, Users, ChevronRight } from 'lucide-react';
import { GameLog, RoundResult, Player, Role } from '../types';

interface AdminLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLog[];
  roundsHistory: RoundResult[];
  players: Player[];
}

export default function AdminLogModal({ isOpen, onClose, logs, roundsHistory, players }: AdminLogModalProps) {
  const [selectedRoundForDetails, setSelectedRoundForDetails] = useState<RoundResult | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div 
        id="admin-log-modal"
        className="w-full max-w-4xl bg-[#0e1017] border border-gold-900/50 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gold-900/30 bg-gold-950/20">
          <div className="flex items-center gap-2.5 text-gold-400">
            <ShieldAlert className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="font-display font-bold tracking-wider text-white text-base">게임 과정 기록 확인</h3>
              <p className="text-xs text-gray-400 font-mono">Round History & Secret Roles Records</p>
            </div>
          </div>
          <button 
            id="close-admin-log-btn"
            onClick={onClose} 
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Secret Roles Section (Req 10) */}
          {players.length > 0 && (
            <div className="space-y-3 bg-black/40 border border-gold-900/20 p-4 rounded-xl">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400 border-b border-gray-900 pb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gold-500" /> 전체 학생 배정 역할 목록 ({players.length}명)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {players.map((p) => (
                  <div key={p.id} className="p-2.5 bg-[#12141d] border border-gray-800/80 rounded-lg text-center flex flex-col justify-between">
                    <span className="font-bold text-xs text-gray-200 block truncate">{p.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded mt-1 inline-block ${
                      p.role === Role.CITIZEN_LEADER ? 'bg-gold-950 text-gold-400 border border-gold-500/30' :
                      p.role === Role.CITIZEN ? 'bg-gray-800 text-gray-300' :
                      p.role === Role.CRIMINAL_LEADER ? 'bg-red-950 text-red-400 border border-red-500/30' :
                      'bg-red-950/50 text-red-300'
                    }`}>
                      {p.role === Role.CITIZEN && '시민'}
                      {p.role === Role.CITIZEN_LEADER && '시민 리더'}
                      {p.role === Role.CRIMINAL && '범죄자'}
                      {p.role === Role.CRIMINAL_LEADER && '범죄자 리더'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round Results Summary Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400 border-b border-gray-900 pb-1.5">
              📊 라운드 별 재판 결과 요약 ({roundsHistory.length}개 완료)
            </h4>
            
            {roundsHistory.length === 0 ? (
              <div className="text-center py-6 bg-black/40 border border-gray-800/40 rounded-xl text-xs text-gray-500 italic">
                진행 완료된 라운드 결과가 없습니다. 게임이 진행되면 여기에 실시간으로 기록됩니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roundsHistory.map((round) => {
                  const president = players[round.juryPresidentIndex]?.name || `플레이어 ${round.juryPresidentIndex + 1}`;
                  const members = round.juryMembers.map(idx => players[idx]?.name || `플레이어 ${idx + 1}`).join(', ');
                  
                  return (
                    <div 
                      key={round.round} 
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-md ${
                        round.result === 'citizen'
                          ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300'
                          : round.result === 'criminal'
                          ? 'bg-red-950/10 border-red-900/30 text-red-300'
                          : 'bg-black/40 border-gray-800 text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase">
                          📍 제 {round.round}차 재판
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow ${
                          round.result === 'citizen'
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                            : round.result === 'criminal'
                            ? 'bg-red-900/40 text-red-300 border border-red-500/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {round.result === 'citizen' ? '유죄 선고 (시민 승리)' : round.result === 'criminal' ? '무죄 선고 (범죄자 승리)' : '진행 중'}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-gray-300">
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">배심원장:</span>
                          <span className="font-bold text-gray-200">{president}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-gray-500 font-medium flex-shrink-0">배심원단:</span>
                          <span className="font-bold text-gray-200 text-right line-clamp-1">{members}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">인준 투표:</span>
                          <span className="font-bold text-gray-200">{round.isApproved ? `찬성 가결 (${round.approveVotes}표)` : '제안 부결'}</span>
                        </div>
                        
                        {/* Clickable Vote breakdown row (Req 17) */}
                        {round.isApproved && (
                          <button
                            onClick={() => setSelectedRoundForDetails(round)}
                            className="w-full mt-2 p-2 bg-black/60 hover:bg-gold-950/30 border border-gold-900/40 hover:border-gold-500/50 rounded-lg transition flex items-center justify-between text-[11px] font-mono group cursor-pointer"
                          >
                            <span className="text-gray-400 font-semibold group-hover:text-gold-300 transition">🔍 투표 결과 (상세 보기):</span>
                            <div className="flex items-center gap-1 font-bold">
                              <span className="text-emerald-400">유죄 {round.guiltyVotes}표</span>
                              <span className="text-gray-600">/</span>
                              <span className="text-red-400">무죄 {round.innocentVotes}표</span>
                              <ChevronRight className="w-4 h-4 text-gold-500 group-hover:translate-x-0.5 transition" />
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logs View */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400">
              진행 전반 로그기록 ({logs.length}개)
            </h4>

            <div className="border border-gray-800 bg-black/60 rounded-lg overflow-hidden h-[250px] flex flex-col font-mono text-xs">
              <div className="grid grid-cols-12 gap-2 p-2 bg-gray-950 text-gray-400 border-b border-gray-800 font-bold">
                <div className="col-span-3">시간</div>
                <div className="col-span-2">분류</div>
                <div className="col-span-7">내용</div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600 italic">
                    아직 기록된 로그가 없습니다. 게임이 시작되면 기록됩니다.
                  </div>
                ) : (
                  [...logs].reverse().map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`grid grid-cols-12 gap-2 p-1 rounded hover:bg-gray-900 transition ${
                        log.category.includes('범죄자') || log.category.includes('패배') || log.category.includes('부결')
                          ? 'text-red-300 bg-red-950/5'
                          : log.category.includes('시민') || log.category.includes('승리') || log.category.includes('통과')
                          ? 'text-green-300 bg-green-950/5'
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="col-span-3 text-gray-500 text-[10px]">{log.timestamp}</div>
                      <div className="col-span-2 font-bold text-gold-400 text-[11px]">[{log.category}]</div>
                      <div className="col-span-7 leading-normal">{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-900/40 bg-black/40 flex justify-end">
          <button
            id="close-admin-log-footer-btn"
            onClick={onClose}
            className="px-4 py-2 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white text-xs rounded transition"
          >
            닫기
          </button>
        </div>

        {/* Detailed Vote Result Modal Layer (Req 17) */}
        {selectedRoundForDetails && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0e1017] border-2 border-gold-500 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-gold-900/40 pb-3">
                <div>
                  <h4 className="font-display text-xl font-extrabold text-gold-400">
                    제 {selectedRoundForDetails.round}차 재판 - 상세 투표 결과
                  </h4>
                  <p className="text-xs text-gray-400 font-mono">Detailed Member Votes Breakdown</p>
                </div>
                <button
                  onClick={() => setSelectedRoundForDetails(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-full bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vote Stats Banner */}
              <div className="flex justify-around p-3 bg-black/60 rounded-xl border border-gold-950 text-center font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">총 투표수</span>
                  <span className="text-lg font-bold text-white">{selectedRoundForDetails.guiltyVotes + selectedRoundForDetails.innocentVotes}표</span>
                </div>
                <div className="border-r border-gray-800" />
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase block">유죄 표수</span>
                  <span className="text-lg font-bold text-emerald-400">{selectedRoundForDetails.guiltyVotes}표</span>
                </div>
                <div className="border-r border-gray-800" />
                <div>
                  <span className="text-[10px] text-red-400 uppercase block">무죄 표수</span>
                  <span className="text-lg font-bold text-red-400">{selectedRoundForDetails.innocentVotes}표</span>
                </div>
              </div>

              {/* Individual Member Votes List */}
              <div className="space-y-2">
                <h5 className="text-xs font-mono font-bold text-gray-300 uppercase">
                  👥 배심원별 투표 행사 내역:
                </h5>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedRoundForDetails.memberVotes && selectedRoundForDetails.memberVotes.length > 0 ? (
                    selectedRoundForDetails.memberVotes.map((mv, idx) => {
                      const voterName = players[mv.playerIndex]?.name || `플레이어 ${mv.playerIndex + 1}`;
                      const voterRole = players[mv.playerIndex]?.role;
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-black/40 border border-gray-800 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-200">{voterName}</span>
                            {voterRole && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                ({voterRole === Role.CITIZEN ? '시민' : voterRole === Role.CITIZEN_LEADER ? '시민리더' : voterRole === Role.CRIMINAL ? '범죄자' : '범죄자리더'})
                              </span>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-black uppercase ${
                            mv.vote === 'guilty'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}>
                            {mv.vote === 'guilty' ? '유죄 (Guilty)' : '무죄 (Innocent)'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    selectedRoundForDetails.juryMembers.map((pIdx, idx) => {
                      const voterName = players[pIdx]?.name || `플레이어 ${pIdx + 1}`;
                      return (
                        <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg flex items-center justify-between text-xs text-gray-400">
                          <span>{voterName}</span>
                          <span className="italic text-[10px]">익명 가명 투표 완료</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedRoundForDetails(null)}
                className="w-full py-2.5 bg-gold-600 hover:bg-gold-500 text-black font-extrabold text-xs rounded-xl shadow transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
