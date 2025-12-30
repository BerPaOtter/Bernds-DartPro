
import React from 'react';
import { Home, Settings, Trophy, Users, ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  onHome?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack, onHome }) => {
  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-950 border-x border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden font-sans">
      {/* Header - Glassmorphism Refined */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100] h-16 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 hover:bg-white/5 active:scale-90 rounded-xl transition-all"
              aria-label="Back"
            >
              <ChevronLeft size={22} className="text-slate-400" />
            </button>
          )}
          <h1 className="text-lg font-black italic uppercase tracking-tighter text-white truncate max-w-[180px]">
            {title}
          </h1>
        </div>
        {onHome ? (
          <button 
            onClick={onHome} 
            className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 active:scale-90 transition-all"
          >
            <Home size={18} />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth">
          {children}
        </div>
      </main>

      {/* Navigation Bar - Refined UX */}
      <nav className="shrink-0 w-full max-w-lg bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-2 py-2 flex justify-around items-center z-[100] h-20 pb-safe">
        <NavButton icon={<Home size={20} />} label="Menu" active={window.location.hash === '#/'} onClick={() => window.location.hash = '#/'} />
        <NavButton icon={<Users size={20} />} label="Kader" active={window.location.hash === '#/players'} onClick={() => window.location.hash = '#/players'} />
        <NavButton icon={<Trophy size={20} />} label="Stats" active={window.location.hash === '#/stats'} onClick={() => window.location.hash = '#/stats'} />
        <NavButton icon={<Settings size={20} />} label="Setup" active={window.location.hash === '#/setup'} onClick={() => window.location.hash = '#/setup'} />
      </nav>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}} />
    </div>
  );
};

const NavButton = ({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
      active 
      ? 'text-emerald-400 bg-emerald-500/10' 
      : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

export default Layout;
