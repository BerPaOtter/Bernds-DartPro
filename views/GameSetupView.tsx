
import React, { useState, useEffect, useMemo } from 'react';
import { GameMode, BotDifficulty, Player, CheckMode, MatchMode } from '../types';
import Layout from '../components/Layout';
import { Target, Bot, CheckCircle2, UserCircle2, ArrowRight, Minus, Plus, Skull, ShieldCheck, Sparkles, Wand2, Info, CircleDot } from 'lucide-react';

const STORAGE_KEY = 'dartmaster_players';
const MATCH_CONFIG_KEY = 'dartmaster_current_match';

const GameSetupView: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.X01);
  const [targetScore, setTargetScore] = useState(301);
  const [checkIn, setCheckIn] = useState<CheckMode>(CheckMode.STRAIGHT);
  const [checkOut, setCheckOut] = useState<CheckMode>(CheckMode.STRAIGHT);
  const [matchMode, setMatchMode] = useState<MatchMode>(MatchMode.FIRST_TO);
  const [legs, setLegs] = useState(1);
  const [sets, setSets] = useState(1);
  const [roster, setRoster] = useState<Player[]>([]);
  const [includeBot, setIncludeBot] = useState(false);
  const [botDiff, setBotDiff] = useState<BotDifficulty>(BotDifficulty.MEDIUM);
  const [welpenschutz, setWelpenschutz] = useState(false);
  const [cricketBullseye, setCricketBullseye] = useState(true);
  
  const [showSpecials, setShowSpecials] = useState(false);
  const [tripleSpecial, setTripleSpecial] = useState(false);
  const [surprise, setSurprise] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRoster(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const selectedPlayers = useMemo(() => roster.filter(p => p.selected), [roster]);

  const startGame = () => {
    if (selectedPlayers.length === 0 && !includeBot) {
      alert("Wähle mindestens einen Spieler.");
      return;
    }

    const matchConfig = {
      mode, targetScore, checkIn, checkOut, matchMode, legs, sets,
      players: selectedPlayers, includeBot, botDifficulty: botDiff,
      welpenschutz: mode === GameMode.ELIMINATION ? welpenschutz : false,
      cricketBullseye: mode === GameMode.CRICKET ? cricketBullseye : undefined,
      eliminationSpecials: mode === GameMode.ELIMINATION ? { tripleSpecial, surprise } : undefined
    };

    localStorage.setItem(MATCH_CONFIG_KEY, JSON.stringify(matchConfig));
    window.location.hash = '#/play';
  };

  if (showSpecials) {
    return (
      <Layout title="Specials" onBack={() => setShowSpecials(false)}>
        <div className="flex flex-col h-full bg-slate-950 p-6 space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="space-y-2">
             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">MODS</h2>
             <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">Game Rules Modification</p>
          </div>
          <div className="space-y-4">
            <SpecialToggle active={tripleSpecial} onToggle={() => setTripleSpecial(!tripleSpecial)} icon={<Wand2 className="text-blue-400" />} title="3-er Penalty" desc="Treffer auf 3 zieht den nächsten Wurf vom Score ab." color="blue" />
            <SpecialToggle active={surprise} onToggle={() => setSurprise(!surprise)} icon={<Sparkles className="text-purple-400" />} title="Surprise Mode" desc="Zufällige Runden mit 'Nur Einer' Limitierung (1-9)." color="purple" />
          </div>
          <button onClick={() => setShowSpecials(false)} className="w-full py-5 bg-white text-slate-950 font-black text-xs uppercase rounded-3xl active:scale-95 transition-all mt-auto shadow-2xl">Fertig</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Game" onBack={() => window.location.hash = '#/'}>
      <div className="flex flex-col h-full bg-slate-950 p-5 space-y-8 overflow-y-auto pb-40">
        
        {/* Modus Wahl */}
        <div className="space-y-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Spielmodus</span>
          <div className="flex bg-slate-900/80 p-1.5 rounded-[2rem] gap-1.5 border border-white/5">
            {[GameMode.X01, GameMode.CRICKET, GameMode.ELIMINATION].map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all ${mode === m ? 'bg-emerald-500 text-slate-950 shadow-xl' : 'text-slate-500'}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Configbereich */}
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-7 space-y-8 shadow-2xl">
          {mode === GameMode.CRICKET ? (
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Target size={24} /></div>
                 <div><h3 className="font-black text-sm uppercase text-white">Cricket</h3><p className="text-[9px] font-bold text-slate-500 uppercase">Sektor-Wahnsinn</p></div>
               </div>
               <ToggleCard active={cricketBullseye} onToggle={() => setCricketBullseye(!cricketBullseye)} icon={<CircleDot size={20} />} label="Inklusive Bullseye" sub="25 als Sektor möglich" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {[101, 301, 501].map(s => (
                  <button key={s} onClick={() => setTargetScore(s)} className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${targetScore === s ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-inner' : 'border-white/5 bg-slate-950/50 text-slate-600'}`}>{s}</button>
                ))}
              </div>
              <div className="space-y-4">
                <ModeSelect label="Check-Out" value={checkOut} options={[CheckMode.STRAIGHT, CheckMode.DOUBLE, CheckMode.MASTER]} onChange={(v) => setCheckOut(v as CheckMode)} />
                <div className="grid grid-cols-2 gap-3">
                  <Counter label="Legs" value={legs} max={10} onInc={() => setLegs(l => Math.min(10, l + 1))} onDec={() => setLegs(l => Math.max(1, l - 1))} />
                  <Counter label="Sets" value={sets} max={10} onInc={() => setSets(s => Math.min(10, s + 1))} onDec={() => setSets(s => Math.max(1, s - 1))} />
                </div>
              </div>
            </div>
          )}

          {mode === GameMode.ELIMINATION && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <ToggleCard active={welpenschutz} onToggle={() => setWelpenschutz(!welpenschutz)} icon={<ShieldCheck size={20} />} label="Welpenschutz" sub="Kein Rauswurf unter 100 Pkt" />
              <button onClick={() => setShowSpecials(true)} className="w-full flex items-center justify-between p-5 bg-slate-950 border border-white/5 rounded-3xl active:scale-95 transition-all group">
                <div className="flex items-center gap-4"><Sparkles size={20} className="text-purple-400" /><span className="font-black text-[11px] uppercase text-white">Specials Aktivieren</span></div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
              </button>
            </div>
          )}
        </div>

        {/* Player Roster */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Teilnehmer ({selectedPlayers.length})</span>
            <button onClick={() => window.location.hash = '#/players'} className="text-emerald-400 text-[10px] font-black uppercase flex items-center gap-2 hover:opacity-70 transition-opacity">Kader Verwalten <ArrowRight size={14} /></button>
          </div>
          <div className="space-y-2.5">
            {selectedPlayers.map(p => (
              <div key={p.id} className="bg-slate-900/60 p-4 rounded-3xl flex items-center justify-between border border-white/5 animate-in slide-in-from-left duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500/20 overflow-hidden shadow-inner">
                    {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <UserCircle2 size={20} className="m-auto mt-2 text-slate-700" />}
                  </div>
                  <span className="font-black text-sm text-white uppercase tracking-tight">{p.name}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><CheckCircle2 size={14} className="text-emerald-500" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
        <button onClick={startGame} className="w-full py-6 bg-emerald-500 text-slate-950 font-black text-sm rounded-[2.5rem] shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all uppercase tracking-[0.2em] active:scale-95">Dart Battle Starten</button>
      </div>
    </Layout>
  );
};

const ModeSelect = ({ label, value, options, onChange }: any) => (
  <div className="space-y-2.5">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</span>
    <div className="flex bg-slate-950 p-1.5 rounded-2xl gap-1.5 border border-white/5">
      {options.map((opt: any) => (
        <button key={opt} onClick={() => onChange(opt)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${value === opt ? 'bg-slate-800 text-emerald-400 shadow-inner' : 'text-slate-600'}`}>{opt}</button>
      ))}
    </div>
  </div>
);

const Counter = ({ label, value, onInc, onDec }: any) => (
  <div className="space-y-2.5">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center block">{label}</span>
    <div className="flex items-center justify-between bg-slate-950 rounded-2xl p-2 border border-white/5 shadow-inner">
      <button onClick={onDec} className="p-2.5 text-slate-600 active:text-white"><Minus size={16} /></button>
      <span className="font-black text-sm mono text-white">{value}</span>
      <button onClick={onInc} className="p-2.5 text-emerald-500 active:text-white"><Plus size={16} /></button>
    </div>
  </div>
);

const ToggleCard = ({ active, onToggle, icon, label, sub }: any) => (
  <div onClick={onToggle} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer ${active ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-950 border-white/5'}`}>
    <div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>{icon}</div><div className="flex flex-col"><span className={`font-black text-[11px] uppercase ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span><span className="text-[8px] font-bold text-slate-600 uppercase">{sub}</span></div></div>
    <div className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-800'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} /></div>
  </div>
);

const SpecialToggle = ({ active, onToggle, icon, title, desc, color }: any) => (
  <div className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${active ? (color === 'blue' ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10') : 'bg-slate-900 border-white/5'}`} onClick={onToggle}>
    <div className="flex items-center justify-between mb-4"><div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5">{icon}</div><div className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? (color === 'blue' ? 'bg-blue-500' : 'bg-purple-500') : 'bg-slate-800'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} /></div></div>
    <h3 className="text-sm font-black text-white uppercase mb-1">{title}</h3>
    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">{desc}</p>
  </div>
);

export default GameSetupView;
