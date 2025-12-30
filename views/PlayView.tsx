import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from '../components/Layout';
import { Bot as BotIcon, User, Check, Undo2, XCircle, Target, Zap, AlertTriangle, Sparkles, Trophy } from 'lucide-react';
import { Throw, Player, GameMode, CheckMode } from '../types';
import { generateSpeech } from '../services/gemini';

const MATCH_CONFIG_KEY = 'dartmaster_current_match';
const STATS_KEY = 'dartmaster_stats';

interface GamePlayer extends Player {
  currentScore: number;
  points: number;
  cricketMarks: Record<number, number>;
  totalPointsScored: number;
  totalDartsThrown: number;
  isEliminated: boolean;
  isIn: boolean;
  lastTurnScore: number;
  isPenaltyActive: boolean; 
  hits: Record<number, number>; // Local session hits
}

interface HistoryStep {
  players: GamePlayer[];
  dartsInTurn: Throw[];
  multiplier: 1 | 2 | 3;
  isSurpriseTurn: boolean;
}

const PlayView: React.FC = () => {
  const [matchConfig, setMatchConfig] = useState<any>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dartsInTurn, setDartsInTurn] = useState<Throw[]>([]);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [cricketTargets, setCricketTargets] = useState<number[]>([]);
  const [winner, setWinner] = useState<GamePlayer | null>(null);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [isSurpriseTurn, setIsSurpriseTurn] = useState(false);
  const [isBotTurnRunning] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isComponentMounted = useRef(true);

  const playAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) { 
      console.debug("Audio play failed", e); 
    }
  };

  const announce = useCallback((text: string, voice: 'Kore' | 'Zephyr' = 'Kore') => {
    if (!isComponentMounted.current) return;
    setAnnouncement(text);
    setTimeout(() => { if (isComponentMounted.current) setAnnouncement(null); }, 2000);
    generateSpeech(text, voice).then(base64 => {
      if (base64 && isComponentMounted.current) playAudio(base64);
    }).catch(e => console.error("TTS error", e));
  }, []);

  const saveStats = (winnerPlayer: GamePlayer) => {
    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      const statsMap = savedStats ? JSON.parse(savedStats) : {};

      players.forEach(p => {
        if (!statsMap[p.id]) statsMap[p.id] = { totalPoints: 0, totalDarts: 0, wins: 0, hits: {} };
        const s = statsMap[p.id];
        s.totalPoints += p.totalPointsScored;
        s.totalDarts += p.totalDartsThrown;
        if (p.id === winnerPlayer.id) s.wins += 1;
        
        // Save hits from this session to long-term stats
        Object.entries(p.hits).forEach(([val, count]) => {
          s.hits[val] = (s.hits[val] || 0) + count;
        });
      });

      localStorage.setItem(STATS_KEY, JSON.stringify(statsMap));
    } catch (e) {
      console.error("Stats saving failed", e);
    }
  };

  const handleNextPlayer = useCallback(() => {
    if (winner || isProcessingTurn || players.length === 0) return;
    setIsProcessingTurn(true);
    
    setPlayers(prev => {
      const nextIdx = (currentPlayerIndex + 1) % prev.length;
      setCurrentPlayerIndex(nextIdx);
      const nextPlayer = prev[nextIdx];
      
      let nextIsSurprise = false;
      if (matchConfig?.mode === GameMode.ELIMINATION && matchConfig?.eliminationSpecials?.surprise) {
        nextIsSurprise = Math.random() < 0.25;
      }
      
      setIsSurpriseTurn(nextIsSurprise);
      if (nextIsSurprise) {
        announce(`Special: ${nextPlayer.name}! Nur einstellige Zahlen!`, 'Zephyr');
      } else {
        announce(`${nextPlayer.name}`);
      }
      return prev;
    });

    setDartsInTurn([]);
    setMultiplier(1);
    setHistory([]);
    setIsProcessingTurn(false);
  }, [players, currentPlayerIndex, winner, isProcessingTurn, announce, matchConfig]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isProcessingTurn || isBotTurnRunning) return;
    const lastStep = history[history.length - 1];
    setPlayers(JSON.parse(JSON.stringify(lastStep.players)));
    setDartsInTurn([...lastStep.dartsInTurn]);
    setMultiplier(lastStep.multiplier);
    setIsSurpriseTurn(lastStep.isSurpriseTurn);
    setHistory(prev => prev.slice(0, -1));
  }, [history, isProcessingTurn, isBotTurnRunning]);

  const handleInput = useCallback((value: number, forcedMult?: 1 | 2 | 3) => {
    if (!matchConfig || winner || isProcessingTurn || dartsInTurn.length >= 3) return;
    let finalMult = forcedMult || multiplier;
    if (value === 25 && finalMult === 3) return;

    setHistory(h => [...h, { 
      players: JSON.parse(JSON.stringify(players)), 
      dartsInTurn: [...dartsInTurn], 
      multiplier,
      isSurpriseTurn 
    }]);

    setPlayers(prevPlayers => {
      const updated = JSON.parse(JSON.stringify(prevPlayers));
      const p = updated[currentPlayerIndex];
      if (!p) return prevPlayers;

      // Record hit
      if (value > 0) {
        p.hits[value] = (p.hits[value] || 0) + 1;
      }

      let scoreVal = value * finalMult;
      
      if (matchConfig.mode === GameMode.X01) {
        if (!p.isIn) {
          const isValidIn = matchConfig.checkIn === CheckMode.STRAIGHT || 
                           (matchConfig.checkIn === CheckMode.DOUBLE && finalMult === 2) ||
                           (matchConfig.checkIn === CheckMode.TRIPLE && finalMult === 3);
          if (isValidIn) p.isIn = true;
          else { p.totalDartsThrown += 1; return updated; }
        }
        const nextScore = p.currentScore - scoreVal;
        const isBust = nextScore < 0 || (nextScore === 1 && matchConfig.checkOut !== CheckMode.STRAIGHT);
        if (isBust) {
          announce("Bust!");
          setDartsInTurn(prev => [...prev, { multiplier: finalMult, value, isBust: true }]);
          setTimeout(handleNextPlayer, 800);
          return updated;
        } else {
          p.currentScore = nextScore;
          p.totalPointsScored += scoreVal;
          p.totalDartsThrown += 1;
          if (nextScore === 0) { setWinner(p); saveStats(p); }
        }
      } else if (matchConfig.mode === GameMode.ELIMINATION) {
        let effectiveScoreVal = scoreVal;
        if (isSurpriseTurn && value >= 10) effectiveScoreVal = 0;

        let nextScore = p.currentScore;
        if (p.isPenaltyActive) {
          nextScore -= effectiveScoreVal;
          p.isPenaltyActive = false; 
        } else {
          nextScore += effectiveScoreVal;
        }

        if (matchConfig.eliminationSpecials?.tripleSpecial && value === 3) {
          p.isPenaltyActive = true;
          announce("Penalty!", "Zephyr");
        }

        if (nextScore > matchConfig.targetScore) {
          announce("Zu viel!");
          setDartsInTurn(prev => [...prev, { multiplier: finalMult, value, isBust: true }]);
          setTimeout(handleNextPlayer, 800);
          return updated;
        }

        p.currentScore = Math.max(0, nextScore);
        p.totalPointsScored += effectiveScoreVal;
        p.totalDartsThrown += 1;

        updated.forEach((other: GamePlayer, idx: number) => {
          if (idx !== currentPlayerIndex && other.currentScore === p.currentScore && p.currentScore > 0) {
            const hasProtection = matchConfig.welpenschutz && other.currentScore < 100;
            if (!hasProtection) {
              other.currentScore = 0;
              announce(`${other.name} raus!`, 'Zephyr');
            }
          }
        });

        if (p.currentScore === matchConfig.targetScore) { setWinner(p); saveStats(p); }
      } else if (matchConfig.mode === GameMode.CRICKET) {
        p.totalDartsThrown += 1;
        if (cricketTargets.includes(value)) {
          const currentMarks = p.cricketMarks[value] || 0;
          const newMarks = currentMarks + finalMult;
          p.cricketMarks[value] = Math.min(3, newMarks);
          const overflow = newMarks - 3;
          if (overflow > 0 && !prevPlayers.every(opp => (opp.cricketMarks[value] || 0) >= 3)) {
            p.currentScore += value * overflow;
            p.totalPointsScored += value * overflow;
          }
          const allClosed = cricketTargets.every(t => (p.cricketMarks[t] || 0) >= 3);
          if (allClosed) {
            const maxOppScore = Math.max(...updated.map(opp => opp.currentScore));
            if (p.currentScore >= maxOppScore) { setWinner(p); saveStats(p); }
          }
        }
      }
      return updated;
    });

    setDartsInTurn(prev => {
      const next = [...prev, { multiplier: finalMult, value, isBust: (isSurpriseTurn && value >= 10) }];
      if (next.length === 3) setTimeout(handleNextPlayer, 1000);
      return next;
    });
    setMultiplier(1);
  }, [matchConfig, winner, isProcessingTurn, dartsInTurn, multiplier, currentPlayerIndex, announce, handleNextPlayer, cricketTargets, players, isSurpriseTurn]);

  useEffect(() => {
    isComponentMounted.current = true;
    const initGame = async () => {
      const saved = localStorage.getItem(MATCH_CONFIG_KEY);
      if (!saved) { window.location.hash = '#/setup'; return; }
      const config = JSON.parse(saved);
      setMatchConfig(config);
      
      let targets: number[] = [];
      if (config.mode === GameMode.CRICKET) {
        const pool = Array.from({length: 20}, (_, i) => i + 1);
        if (config.cricketBullseye) pool.push(25);
        targets = pool.sort(() => 0.5 - Math.random()).slice(0, 6).sort((a,b) => b - a);
      }
      setCricketTargets(targets);

      const initPlayers = config.players.map((p: Player) => ({
        ...p, 
        currentScore: config.mode === GameMode.ELIMINATION || config.mode === GameMode.CRICKET ? 0 : config.targetScore, 
        cricketMarks: targets.reduce((acc, t) => ({ ...acc, [t]: 0 }), {}),
        totalPointsScored: 0, totalDartsThrown: 0, isEliminated: false, isIn: true, isPenaltyActive: false,
        hits: {}
      }));
      setPlayers(initPlayers);
      if (initPlayers.length > 0) announce(`${initPlayers[0].name}`);
    };
    initGame();
    return () => { isComponentMounted.current = false; };
  }, []);

  const turnSum = useMemo(() => dartsInTurn.reduce((acc, d) => acc + (d.isBust ? 0 : d.value * d.multiplier), 0), [dartsInTurn]);

  const renderMarks = (count: number) => {
    if (count === 0) return <span className="text-slate-800 opacity-20">.</span>;
    if (count === 1) return <span className="text-emerald-500/60">/</span>;
    if (count === 2) return <span className="text-emerald-500">X</span>;
    return <span className="text-emerald-400 font-black ring-1 ring-emerald-500/50 rounded-full px-1">O</span>;
  };

  return (
    <Layout title={matchConfig?.mode || "Spiel"} onBack={() => window.location.hash = '#/setup'}>
      <div className={`flex flex-col h-full bg-slate-950 overflow-hidden transition-all duration-700 ${isSurpriseTurn ? 'ring-inset ring-8 ring-purple-500/20' : ''}`}>
        
        <div className="shrink-0 bg-slate-900 px-4 border-b border-white/5 flex justify-between items-center h-16 relative">
           <div className="flex items-center gap-4 relative z-10">
              <div className={`w-4 h-4 rounded-full ${players[currentPlayerIndex]?.isBot ? 'bg-blue-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{players[currentPlayerIndex]?.name}</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white mono">{players[currentPlayerIndex]?.currentScore}</span>
                  {dartsInTurn.length > 0 && <span className="text-sm font-black text-emerald-400">+{turnSum}</span>}
                </div>
              </div>
           </div>
           
           <div className="flex gap-1.5 relative z-10">
              {[0,1,2].map(i => (
                <div key={i} className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                  dartsInTurn[i]?.isBust ? 'border-red-500 bg-red-500/10 text-red-500' :
                  dartsInTurn[i] ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 
                  'border-white/5 bg-slate-950 text-slate-800'
                }`}>
                  {dartsInTurn[i] ? (dartsInTurn[i].isBust ? 'X' : `${dartsInTurn[i].multiplier > 1 ? (dartsInTurn[i].multiplier === 2 ? 'D' : 'T') : ''}${dartsInTurn[i].value}`) : ''}
                </div>
              ))}
           </div>
        </div>

        <div className="shrink-0 bg-slate-950 flex overflow-x-auto no-scrollbar py-3 px-4 gap-3 border-b border-white/5">
           {players.map((p, idx) => (
             <div key={p.id} className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all shrink-0 ${idx === currentPlayerIndex ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900 border-white/5 opacity-60'}`}>
               <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                 {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <User size={12} className="m-auto mt-1" />}
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-black uppercase text-slate-500 leading-none mb-1">{p.name}</span>
                 <span className="text-sm font-black text-white mono leading-none">{p.currentScore}</span>
               </div>
             </div>
           ))}
        </div>

        {matchConfig?.mode === GameMode.CRICKET && (
          <div className="shrink-0 bg-slate-900/50 px-2 py-2 flex justify-around gap-1 border-b border-white/5">
            {cricketTargets.map(t => (
              <div key={t} className="flex flex-col items-center flex-1 py-1 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 mb-1">{t === 25 ? 'B' : t}</span>
                <div className="text-sm h-4 flex items-center">{renderMarks(players[currentPlayerIndex]?.cricketMarks[t] || 0)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 p-2 flex flex-col gap-2 bg-slate-950">
           <div className="grid grid-cols-2 gap-2 h-12 shrink-0">
              <ModifierBtn label="Double" active={multiplier === 2} onClick={() => setMultiplier(m => m === 2 ? 1 : 2)} color="emerald" />
              <ModifierBtn label="Triple" active={multiplier === 3} onClick={() => setMultiplier(m => m === 3 ? 1 : 3)} color="emerald" />
           </div>

           <div className="grid grid-cols-3 gap-2 h-14 shrink-0">
              <ActionBtn icon={<Undo2 size={18} />} label="Undo" onClick={handleUndo} color="amber" disabled={history.length === 0} />
              <button 
                onClick={() => handleInput(25)} 
                disabled={multiplier === 3 || isSurpriseTurn}
                className={`rounded-2xl font-black text-lg flex items-center justify-center transition-all active:scale-95 ${isSurpriseTurn ? 'bg-slate-900 text-slate-800' : 'bg-red-600 text-white shadow-lg shadow-red-900/20'}`}
              >
                BULL
              </button>
              <ActionBtn icon={<XCircle size={18} />} label="Miss" onClick={() => handleInput(0)} color="slate" />
           </div>

           <div className="flex-1 grid grid-cols-5 gap-1.5 p-1">
              {Array.from({length: 20}, (_, i) => i + 1).map(n => {
                const isCricket = cricketTargets.includes(n);
                const isLocked = isSurpriseTurn && n >= 10;
                return (
                  <button 
                    key={n} 
                    onClick={() => handleInput(n)} 
                    className={`rounded-xl font-black text-lg flex items-center justify-center transition-all active:scale-90 border-b-4 ${
                      isLocked ? 'bg-slate-900 text-slate-700 border-slate-950' :
                      isCricket ? 'bg-emerald-600 text-white border-emerald-900 shadow-lg' : 
                      'bg-slate-800 text-slate-300 border-slate-950'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
           </div>

           <button 
              onClick={handleNextPlayer} 
              disabled={dartsInTurn.length === 0}
              className="h-16 w-full bg-emerald-500 text-slate-950 font-black text-sm uppercase rounded-2xl flex items-center justify-center gap-3 active:scale-95 shadow-2xl disabled:opacity-30 transition-all mb-safe"
           >
              Runde beenden <Check size={20} />
           </button>
        </div>

        {announcement && (
          <div className="fixed top-1/2 left-0 right-0 z-[100] flex justify-center pointer-events-none transform -translate-y-1/2">
            <div className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-3xl shadow-[0_20px_60px_rgba(16,185,129,0.5)] border-4 border-white/20 animate-in zoom-in duration-300">
               <span className="text-2xl font-black uppercase italic tracking-tighter">{announcement}</span>
            </div>
          </div>
        )}

        {winner && (
          <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
             <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce" />
             <h1 className="text-4xl font-black text-white italic uppercase mb-2">GAME OVER!</h1>
             <p className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-10 text-center">{winner.name} GEWINNT!</p>
             <button onClick={() => window.location.hash = '#/'} className="px-12 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-2xl">Hauptmenü</button>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .mb-safe { margin-bottom: env(safe-area-inset-bottom, 0px); }
      `}} />
    </Layout>
  );
};

const ModifierBtn = ({ label, active, onClick, color }: any) => (
  <button onClick={onClick} className={`rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all active:scale-95 ${active ? 'bg-emerald-500 border-white/20 text-slate-950' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
    {label}
  </button>
);

const ActionBtn = ({ icon, label, onClick, color, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} className={`rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-20 ${color === 'amber' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
    {icon} <span className="text-[8px] font-black uppercase">{label}</span>
  </button>
);

export default PlayView;