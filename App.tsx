
import React, { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
import GameSetupView from './views/GameSetupView';
import PlayView from './views/PlayView';
import StatsView from './views/StatsView';
import PlayersView from './views/PlayersView';
import ProfileView from './views/ProfileView';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderView = () => {
    const [path, queryString] = currentPath.split('?');
    const params = new URLSearchParams(queryString);

    switch (path) {
      case '#/':
        return <HomeView />;
      case '#/setup':
        return <GameSetupView />;
      case '#/play':
        return <PlayView />;
      case '#/stats':
        return <StatsView />;
      case '#/players':
        return <PlayersView />;
      case '#/profile':
        return <ProfileView playerId={params.get('id') || ''} />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      {renderView()}
    </div>
  );
};

export default App;
