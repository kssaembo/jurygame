import { X, Download, ShieldAlert } from 'lucide-react';
import { GameLog, RoundResult, Player } from '../types';

interface AdminLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLog[];
  roundsHistory: RoundResult[];
  players: Player[];
}

export default function AdminLogModal({ isOpen, onClose, logs, roundsHistory, players }: AdminLogModalProps) {
  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    // 1. Format Round Results
    const roundHeaders = ['라운드', '배심원장', '배심원단', '인준 가결 여부', '인준 찬성표', '유죄 표수', '무죄 표수', '라운드 결과'];
    const roundRows = (roundsHistory || []).map(round => {
      const president = players[round.juryPresidentIndex]?.name || `플레이어 ${round.juryPresidentIndex + 1}`;
      const members = round.juryMembers.map(idx => players[idx]?.name || `플레이어 ${idx + 1}`).join('; ');
      const isApprovedText = round.isApproved ? '가결' : '부결';
      const resultText = round.result === 'citizen' ? '유죄 선고 (시민 승리)' : round.result === 'criminal' ? '무죄 선고 (범죄자 승리)' : '-';
      
      return [
        `제 ${round.round}차 재판`,
        president,
        members,
        isApprovedText,
        round.approveVotes,
        round.isApproved ? round.guiltyVotes : '-',
        round.isApproved ? round.innocentVotes : '-',
        resultText
      ];
    });

    // 2. Format Logs
    const logHeaders = ['시간', '분류', '상세 내용'];
    const logRows = logs.map(log => [
      log.timestamp,
      log.category,
      log.message.replace(/"/g, '""'), // Escape double quotes
    ]);

    // 3. Build CSV Content
    const csvContent = [
      '=== [1] 라운드별 결과 요약 ===',
      roundHeaders.join(','),
      ...roundRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== [2] 전체 진행 로그 ===',
      logHeaders.join(','),
      ...logRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility in Korean language
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `배심원게임_진행기록_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div 
        id="admin-log-modal"
        className="w-full max-w-4xl bg-[#0e1017] border border-red-900/50 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-900/30 bg-red-950/20">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-display font-bold tracking-wider text-white text-base">게임 제어 & 관리자 로그</h3>
              <p className="text-xs text-gray-400 font-mono">Teacher Console Log & Game Database</p>
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
                        {round.isApproved && (
                          <div className="flex justify-between pt-1.5 border-t border-white/5 font-mono text-[11px]">
                            <span className="text-gray-500">투표 결과:</span>
                            <span className="font-semibold">
                              유죄 <span className="text-emerald-400 font-bold">{round.guiltyVotes}표</span> / 무죄 <span className="text-red-400 font-bold">{round.innocentVotes}표</span>
                            </span>
                          </div>
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
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400">
                진행 전반 로그기록 ({logs.length}개)
              </h4>
              <button
                id="download-csv-btn"
                onClick={handleDownloadCSV}
                disabled={logs.length === 0}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                  logs.length === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gold-600 hover:bg-gold-500 text-black shadow-lg shadow-gold-950/20'
                }`}
              >
                <Download className="w-3.5 h-3.5" /> 엑셀 파일 다운로드 (.csv)
              </button>
            </div>

            <div className="border border-gray-800 bg-black/60 rounded-lg overflow-hidden h-[300px] flex flex-col font-mono text-xs">
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
      </div>
    </div>
  );
}
