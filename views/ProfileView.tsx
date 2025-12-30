
import React, { useMemo } from 'react';
import Layout from '../components/Layout';
import { User, TrendingUp, Target, Award, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Player } from '../types';

const STORAGE_KEY = 'dartmaster_players';
const STATS_KEY = 'dartmaster_stats';

const ProfileView: React.FC<{ playerId: string }> = ({ playerId }) => {
  const player = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const players: Player[] = saved ? JSON.parse(saved) : [];
    return players.find(p => p.id === playerId);
  }, [playerId]);

  const stats = useMemo(() => {
    const saved = localStorage.getItem(STATS_KEY);
    const statsMap = saved ? JSON.parse(saved) : {};
    const pStats = statsMap[playerId] || { totalPoints: 0, totalDarts: 0, hits: {} };

    const avg = pStats.totalDarts > 0 
      ? ((pStats.totalPoints / pStats.totalDarts) * 3).toFixed(1)
      : "0.0";

    let mostHit = "N/A";
    let maxCount = 0;
    Object.entries(pStats.hits).forEach(([field, count]) => {
      if ((count as number) > maxCount) {
        maxCount = count as number;
        mostHit = field === "25" ? "Bull" : field;
      }
    });

    return { avg, mostHit, totalGames: Object.keys(pStats.hits).length > 0 ? "Aktiv" : "Neu" };
  }, [playerId]);

  if (!player) return null;

  return (
    <Layout title="Profil" onBack={() => window.history.back()}>
      <div className="flex flex-col h-full bg-slate-950 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top Profile Header */}
        <div className="relative pt-12 pb-10 flex flex-col items-center bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="w-40 h-40 rounded-full border-4 border-emerald-500 p-1 shadow-[0_0_60px_rgba(16,185,129,0.3)] bg-slate-800 overflow-hidden mb-6">
            {player.avatar ? (
              <img src={player.avatar} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={80} className="text-slate-700" />
              </div>
            )}
          </div>
          
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-1">
            {player.name}
          </h1>
          <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Dart Pro Athlet</span>
          </div>
        </div>

        {/* Evaluations Section */}
        <div className="p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Auswertungen</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <StatCard 
              icon={<TrendingUp className="text-emerald-400" />} 
              label="3-Dart Average" 
              value={stats.avg} 
              description="Basierend auf allen X01 Turnieren"
            />
            <StatCard 
              icon={<Target className="text-red-400" />} 
              label="Bester Sektor" 
              value={stats.mostHit} 
              description="Dein am häufigsten getroffenes Feld"
            />
            <StatCard 
              icon={<Award className="text-yellow-400" />} 
              label="Profilstatus" 
              value={stats.totalGames} 
              description="Aktivität seit Registrierung"
            />
          </div>

          <div className="mt-8 p-5 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-4">
              <ShieldAlert size={20} className="text-slate-700 shrink-0" />
              <p className="text-[9px] text-slate-500 uppercase font-black leading-relaxed tracking-tight">
                Die Daten werden lokal auf deinem Gerät gespeichert und nach jedem Spielzug in Echtzeit aktualisiert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon, label, value, description }: { icon: React.ReactNode, label: string, value: string, description: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-xl active:scale-95 transition-transform">
    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
      {icon}
    </div>
    <div className="space-y-0.5">
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block">{label}</span>
      <span className="text-4xl font-black text-white italic tracking-tighter block leading-none">{value}</span>
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight block">{description}</span>
    </div>
  </div>
);

export default ProfileView;
