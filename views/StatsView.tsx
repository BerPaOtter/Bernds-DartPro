
import React, { useMemo } from 'react';
import Layout from '../components/Layout';
import { Trophy, User, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { Player } from '../types';

const STORAGE_KEY = 'dartmaster_players';
const STATS_KEY = 'dartmaster_stats';

const StatsView: React.FC = () => {
  const leaderboard = useMemo(() => {
    try {
      const playersSaved = localStorage.getItem(STORAGE_KEY);
      const players: Player[] = playersSaved ? JSON.parse(playersSaved) : [];
      
      const statsSaved = localStorage.getItem(STATS_KEY);
      const statsMap = statsSaved ? JSON.parse(statsSaved) : {};

      return players.map(p => {
        const pStats = statsMap[p.id] || { totalPoints: 0, totalDarts: 0 };
        const avg = pStats.totalDarts > 0 
          ? (pStats.totalPoints / pStats.totalDarts) * 3 
          : 0;
        return { ...p, avg };
      }).sort((a, b) => b.avg - a.avg);
    } catch (e) {
      console.error("Stats calc error", e);
      return [];
    }
  }, []);

  return (
    <Layout title="Stats Hub" onBack={() => window.location.hash = '#/'}>
      <div className="flex flex-col h-full bg-slate-950 p-6 space-y-8 overflow-y-auto">
        
        {/* Hall of Fame Header */}
        <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_20px_40px_rgba(16,185,129,0.3)] overflow-hidden">
           <Trophy className="absolute -right-4 -bottom-4 text-emerald-400 opacity-20 scale-150 rotate-12" size={120} />
           <div className="relative z-10 space-y-1">
             <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">Hall of Fame</h2>
             <p className="text-[10px] font-bold text-slate-950/60 uppercase tracking-widest">Die globale Dart-Elite</p>
           </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Top Performer</span>
             <span className="text-[8px] font-black text-slate-700 uppercase">Stand: Heute</span>
          </div>
          
          <div className="space-y-2.5">
            {leaderboard.length > 0 ? leaderboard.map((p, idx) => (
              <div 
                key={p.id}
                onClick={() => window.location.hash = `#/profile?id=${p.id}`}
                className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl flex items-center justify-between active:scale-[0.98] active:bg-slate-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-8 text-xs font-black italic ${idx < 3 ? 'text-emerald-400' : 'text-slate-700'}`}>
                    #{idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 overflow-hidden shrink-0 group-hover:border-emerald-500/50 transition-colors">
                     {p.avatar ? (
                       <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
                     ) : (
                       <User size={20} className="m-auto mt-3 text-slate-800" />
                     )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black text-white text-xs uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{p.name}</span>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {p.avg.toFixed(1)} <span className="opacity-40">3-Dart Avg</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <ArrowRight size={16} className="text-slate-700 group-hover:text-emerald-500" />
                </div>
              </div>
            )) : (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-4">
                <Info size={40} className="mx-auto text-slate-800" />
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">Keine Spieldaten verfügbar</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-tight leading-relaxed max-w-[200px] mx-auto">
          Alle Averages werden lokal aus Turnierspielen berechnet.
        </p>
      </div>
    </Layout>
  );
};

export default StatsView;
