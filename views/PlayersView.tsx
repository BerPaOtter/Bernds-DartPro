
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { UserPlus, Trash2, User, Camera, Pencil, Save, X, ShieldAlert } from 'lucide-react';
import { Player } from '../types';

const STORAGE_KEY = 'dartmaster_players';

const PlayersView: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayers(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error("Failed to load players", e);
        setPlayers([]);
      }
    } else {
      const defaultPlayer = [{ id: '1', name: 'Player 1', isBot: false, selected: true }];
      setPlayers(defaultPlayer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPlayer));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeStream]);

  useEffect(() => {
    if (isCameraActive && activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
    }
  }, [isCameraActive, activeStream]);

  const savePlayers = (updated: Player[]) => {
    setPlayers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 }, 
        audio: false 
      });
      setActiveStream(stream);
      setIsCameraActive(true);
      setCapturedPhoto(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Kamera-Zugriff verweigert.");
    }
  };

  const stopCamera = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const toggleSelection = (id: string) => {
    if (editingPlayerId) return; 
    const updated = players.map(p => 
      p.id === id ? { ...p, selected: !p.selected } : p
    );
    savePlayers(updated);
  };

  const handleEdit = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayerId(player.id);
    setNewName(player.name);
    setCapturedPhoto(player.avatar || null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPlayerId(null);
    setNewName('');
    setCapturedPhoto(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const currentAvatar = capturedPhoto || undefined;

    if (editingPlayerId) {
      const updated = players.map(p => 
        p.id === editingPlayerId 
          ? { ...p, name: newName.trim(), avatar: currentAvatar } 
          : p
      );
      savePlayers(updated);
      cancelEdit();
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newName.trim(),
        isBot: false,
        avatar: currentAvatar,
        selected: true 
      };
      savePlayers([...players, newPlayer]);
      setNewName('');
      setCapturedPhoto(null);
    }
  };

  const deletePlayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Diesen Spieler wirklich löschen?`)) {
      const updated = players.filter(p => String(p.id) !== String(id));
      savePlayers(updated);
      if (editingPlayerId === id) cancelEdit();
    }
  };

  const openProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.hash = `#/profile?id=${id}`;
  };

  return (
    <Layout title="Spieler" onBack={() => window.location.hash = '#/'}>
      <div className="flex flex-col h-full bg-slate-950 p-4 space-y-6 overflow-y-auto pb-20">
        
        <section ref={formRef} className={`p-4 rounded-2xl border transition-all ${editingPlayerId ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingPlayerId ? 'Profil bearbeiten' : 'Spieler hinzufügen'}</span>
            {editingPlayerId && <button onClick={cancelEdit} className="text-blue-400"><X size={16} /></button>}
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950">
              {capturedPhoto ? (
                <img src={capturedPhoto} className="w-full h-full object-cover" />
              ) : isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <User size={20} className="m-auto mt-4 text-slate-800" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <button type="button" onClick={isCameraActive ? takePhoto : startCamera} className={`px-4 py-1.5 rounded-lg font-black text-[9px] uppercase ${isCameraActive ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {isCameraActive ? 'Foto speichern' : 'Kamera starten'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none" />
            <button type="submit" disabled={!newName.trim()} className="bg-emerald-500 p-2 rounded-lg text-slate-950 disabled:opacity-20">
              {editingPlayerId ? <Save size={18} /> : <UserPlus size={18} />}
            </button>
          </form>
        </section>

        <section className="space-y-1.5">
          {players.length > 0 ? players.map((player) => (
            <div 
              key={player.id} 
              onClick={() => toggleSelection(player.id)} 
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${player.selected ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  onClick={(e) => openProfile(player.id, e)} 
                  className="w-9 h-9 rounded-full border border-slate-800 bg-slate-950 overflow-hidden active:scale-90 transition-transform"
                >
                  {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-slate-700" />}
                </div>
                <div onClick={(e) => openProfile(player.id, e)}>
                  <h4 className="font-bold text-white text-xs hover:text-emerald-400 transition-colors">{player.name}</h4>
                  <span className={`text-[7px] font-black uppercase ${player.selected ? 'text-emerald-500' : 'text-slate-600'}`}>{player.selected ? 'Bereit' : 'Inaktiv'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => handleEdit(player, e)} className="p-2 text-slate-600 hover:text-blue-500"><Pencil size={14} /></button>
                <button onClick={(e) => deletePlayer(player.id, e)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-700 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-800 rounded-2xl">Keine Spieler vorhanden</div>
          )}
        </section>

        <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex gap-3 items-center">
           <ShieldAlert className="text-slate-700" size={12} />
           <p className="text-[8px] text-slate-600 uppercase font-black tracking-tight leading-relaxed">Antippen zum Einwechseln. Foto/Name antippen für Profil-Stats.</p>
        </div>
      </div>
    </Layout>
  );
};

export default PlayersView;
