
import React from 'react';
import { Play, Settings, Users, BarChart3 } from 'lucide-react';

const Modern3DDartLogo = () => (
  <div className="relative w-48 h-48 animate-bounce-slow">
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_30px_rgba(16,185,129,0.3)]">
      <defs>
        <radialGradient id="boardGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#1e293b' }} />
          <stop offset="100%" style={{ stopColor: '#020617' }} />
        </radialGradient>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34d399' }} />
          <stop offset="100%" style={{ stopColor: '#059669' }} />
        </linearGradient>
      </defs>
      
      {/* Perspective Shadow */}
      <ellipse cx="100" cy="180" rx="70" ry="15" fill="rgba(0,0,0,0.4)" filter="blur(8px)" />
      
      {/* Board Base */}
      <circle cx="100" cy="100" r="90" fill="#0f172a" stroke="#334155" strokeWidth="6" />
      <circle cx="100" cy="100" r="82" fill="url(#boardGrad)" />
      
      {/* Rings */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.5" />
      <circle cx="100" cy="100" r="40" fill="none" stroke="#1e293b" strokeWidth="8" opacity="0.3" />
      
      {/* Accents */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="url(#emeraldGrad)" strokeWidth="1" opacity="0.3" strokeDasharray="10 5" />
      
      {/* Bullseye */}
      <circle cx="100" cy="100" r="12" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
      <circle cx="100" cy="100" r="5" fill="#991b1b" />

      {/* 3D Arrow */}
      <g transform="translate(100, 100) rotate(-45) translate(-5, -90)">
        {/* Arrow Body */}
        <rect x="4" y="10" width="2" height="85" fill="#94a3b8" rx="1" />
        {/* Tip (in board) */}
        <path d="M5 95 L1 100 L9 100 Z" fill="#475569" />
        {/* Flights */}
        <path d="M5 0 L-8 20 L5 15 L18 20 Z" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M5 5 L-5 25 L5 20 L15 25 Z" fill="#f1f5f9" opacity="0.7" />
      </g>
    </svg>
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
    `}} />
  </div>
);

const HomeView: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-[75vh] py-10 px-4">
      <Modern3DDartLogo />
      
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          BERNDS DART <span className="text-emerald-500 not-italic">PRO AI</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Master your precision with AI</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <MenuButton 
          icon={<Play size={28} />} 
          label="Spiel Start" 
          onClick={() => window.location.hash = '#/setup'}
          primary
        />
        <MenuButton 
          icon={<Users size={28} />} 
          label="Spieler" 
          onClick={() => window.location.hash = '#/players'}
        />
        <MenuButton 
          icon={<BarChart3 size={28} />} 
          label="Statistik" 
          onClick={() => window.location.hash = '#/stats'}
        />
        <MenuButton 
          icon={<Settings size={28} />} 
          label="Optionen" 
          onClick={() => window.location.hash = '#/options'}
        />
      </div>
    </div>
  );
};

const MenuButton = ({ icon, label, onClick, primary = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean }) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-3xl flex flex-col items-center gap-3 transition-all active:scale-90 border-2 ${
      primary 
      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
  </button>
);

export default HomeView;
