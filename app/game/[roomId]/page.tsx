'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { IPlayer, IRoom } from '@/models/Room';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Moon, Sun, Shield, Search, Skull, User, Users,
    Crown, Clock, Copy, Ghost, MessageSquare, 
    Menu, X
} from 'lucide-react';

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false); // Mobile toggle

  useEffect(() => {
    const pid = sessionStorage.getItem('mafia_playerId');
    if (!pid) {
      router.push('/');
      return;
    }
    setPlayerId(pid);

    fetch(`/api/game/${roomId}?playerId=${pid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRoom(data.room);
          calculateTimeLeft(data.room);
        } else {
            router.push('/');
        }
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [roomId, router]);

  useEffect(() => {
    if (!room?.gameState?.phaseEndTime) return;
    const interval = setInterval(() => {
      calculateTimeLeft(room);
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.gameState?.phaseEndTime]);

  const calculateTimeLeft = (currentRoom: any) => {
      if (!currentRoom?.gameState?.phaseEndTime) {
          setTimeLeft(0);
          return;
      }
      const end = new Date(currentRoom.gameState.phaseEndTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((end - now) / 1000);
      
      if (diff <= 0) {
          setTimeLeft(0);
          if (currentRoom.status === 'ACTIVE' && diff < -2 && !hasActed) { 
              // triggerProcessPhase(); 
          }
      } else {
          setTimeLeft(diff);
      }
  };

  useEffect(() => {
    if (!playerId || !roomId) return;
    (pusherClient as any).config.auth = { params: { playerId } };
    const channel = pusherClient.subscribe(`presence-${roomId}`);

    channel.bind('player-joined', (player: IPlayer) => {
      setRoom((prev: any) => {
          if (!prev) return null;
          if (prev.players.find((p: any) => p.playerId === player.playerId)) return prev;
          return { ...prev, players: [...prev.players, player] };
      });
    });

    channel.bind('game-started', () => {
        fetch(`/api/game/${roomId}?playerId=${playerId}`)
            .then(res => res.json())
            .then(d => { if (d.success) setRoom(d.room); });
    });

    channel.bind('phase-change', () => {
        fetch(`/api/game/${roomId}?playerId=${playerId}`)
            .then(res => res.json())
            .then(d => {
                if (d.success) {
                    setRoom(d.room);
                    setSelectedTarget(null);
                    setHasActed(false);
                }
            });
    });

    return () => { pusherClient.unsubscribe(`presence-${roomId}`); };
  }, [playerId, roomId]);

  const startGame = async () => {
      await fetch(`/api/game/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', playerId })
      });
  };

  const forcePhase = async () => {
    await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-phase' })
    });
  };

  const sendAction = async (targetId: string) => {
    if (hasActed) return;
    const actionType = room?.gameState.phase === 'DAY' ? 'vote' : 'night-action';
    
    await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, playerId, targetId })
    });
    setSelectedTarget(targetId);
    setHasActed(true);
  };

  const myPlayer = room?.players.find((p: any) => p.playerId === playerId);
  const isHost = room?.players[0]?.playerId === playerId;
  const isDead = myPlayer?.isAlive === false;
  const isNight = room?.gameState.phase === 'NIGHT';

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">LOADING PROTOCOLS...</div>;
  if (!room) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-bold">ROOM NOT FOUND</div>;

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isNight ? 'bg-slate-950' : 'bg-sky-900'} text-white pb-24 font-sans`}>
        
        {/* Dynamic Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
                {isNight ? (
                    <motion.div 
                        key="moon"
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 0.1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 2 }}
                        className="absolute top-10 right-10"
                    >
                        <Moon size={300} />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="sun"
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 0.1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 2 }}
                        className="absolute -top-20 -left-20 text-yellow-500"
                    >
                        <Sun size={400} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg cursor-pointer hover:bg-white/20 transition active:scale-95" onClick={() => navigator.clipboard.writeText(roomId)}>
                    <span className="font-mono font-bold tracking-widest text-sm flex items-center gap-2">
                        {roomId} <Copy size={12} className="opacity-50"/>
                    </span>
                </div>
                <div className="text-xs uppercase font-bold tracking-wider opacity-70 hidden sm:block">
                    {room.status}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-mono font-bold text-xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    <Clock size={20} />
                    {timeLeft}s
                </div>
                <button onClick={() => setShowRoleInfo(!showRoleInfo)} className="sm:hidden p-2 bg-white/10 rounded-full">
                    {showRoleInfo ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </header>

        {/* Floating Night Result Notification */}
        <AnimatePresence>
            {room.gameState.nightResults?.message && (
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-20 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none"
                >
                    <div className="bg-yellow-500/90 text-black font-bold px-6 py-3 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md">
                        <MessageSquare size={16} />
                        {room.gameState.nightResults.message}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <main className="container mx-auto p-4 z-10 relative">
            
            {/* LOBBY VIEW */}
            {room.status === 'LOBBY' && (
                <div className="max-w-md mx-auto mt-10">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <Users className="text-blue-400" /> 
                            SQUAD ({room.players.length}/{room.settings.maxPlayers})
                        </h2>
                        <ul className="space-y-3 mb-8">
                            <AnimatePresence>
                                {room.players.map((p: any) => (
                                    <motion.li 
                                        key={p.playerId}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 20, opacity: 0 }}
                                        className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg shadow-inner font-bold">
                                                {p.avatar === 'default' ? p.name.charAt(0).toUpperCase() : p.avatar}
                                            </div>
                                            <span className="font-bold">{p.name} {p.playerId === playerId && <span className="text-xs bg-blue-500/50 px-2 py-0.5 rounded ml-2">YOU</span>}</span>
                                        </div>
                                        {room.players[0].playerId === p.playerId && <Crown size={16} className="text-yellow-400" />}
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                        {isHost ? (
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame} 
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded-xl shadow-lg transition-all"
                            >
                                START MISSION
                            </motion.button>
                        ) : (
                            <div className="text-center text-sm opacity-50 font-mono animate-pulse">WAITING FOR HOST...</div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* ACTIVE GAME VIEW */}
            {room.status === 'ACTIVE' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Action Center - Top on Mobile */}
                    <motion.div layout className="lg:col-span-3 space-y-6">
                        
                        {/* Phase Header */}
                        <div className="text-center mb-8">
                            <motion.div 
                                key={room.gameState.phase}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-block p-4 rounded-full bg-white/5 backdrop-blur-lg mb-4 border border-white/10"
                            >
                                {isNight ? <Moon size={48} className="text-blue-300" /> : <Sun size={48} className="text-yellow-400" />}
                            </motion.div>
                            <h2 className="text-4xl font-black tracking-tighter mb-2">
                                {isNight ? 'NIGHT FALLS' : 'DAY BREAKS'}
                            </h2>
                            <p className="text-lg opacity-80 max-w-md mx-auto font-medium">
                                {isDead ? "You have been eliminated. You drift through the void." :
                                 isNight ? "Silence falls. Key roles execute their missions in the shadows." :
                                 "The town awakens. Discuss, accuse, and vote to eliminate the impostor."}
                            </p>
                        </div>

                        {/* Player Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {room.players.map((p: any) => {
                                const isMe = p.playerId === playerId;
                                const isSelectable = !isDead && p.isAlive && !isMe && (
                                    (room.gameState.phase === 'DAY') ||
                                    (room.gameState.phase === 'NIGHT' && ['Mafia', 'Doctor', 'Detective'].includes(myPlayer?.role || ''))
                                );
                                const isSelected = selectedTarget === p.playerId;

                                return (
                                    <motion.button
                                        key={p.playerId}
                                        disabled={!isSelectable || hasActed}
                                        onClick={() => sendAction(p.playerId)}
                                        whileHover={isSelectable && !hasActed ? { scale: 1.05, y: -5 } : {}}
                                        whileTap={isSelectable && !hasActed ? { scale: 0.95 } : {}}
                                        className={`
                                            relative p-4 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-[4/5] transition-all
                                            ${!p.isAlive 
                                                ? 'bg-red-900/10 border-red-900/30 grayscale opacity-70' 
                                                : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/30 backdrop-blur-md shadow-lg'}
                                            ${isSelected ? 'ring-4 ring-yellow-400 border-yellow-400 bg-yellow-400/10' : 'border'}
                                            ${!isSelectable && 'cursor-default'}
                                        `}
                                    >
                                        <div className={`
                                            w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner
                                            ${!p.isAlive ? 'bg-red-900/20 text-red-500' : 'bg-gradient-to-br from-white/20 to-white/5'}
                                        `}>
                                            {p.isAlive ? (p.avatar === 'default' ? p.name.charAt(0) : p.avatar) : <Skull />}
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className="font-black text-sm truncate max-w-[100px]">{p.name}</div>
                                            {isMe && <div className="text-[10px] uppercase font-bold text-blue-300 mt-1">YOU</div>}
                                        </div>

                                        {/* Status Indicators */}
                                        {!p.isAlive && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-[1px]"><Skull className="text-red-500 animate-pulse" size={32} /></div>}
                                        
                                        {/* Role Reveals */}
                                        {myPlayer?.role === 'Mafia' && p.role === 'Mafia' && !isMe && (
                                            <div className="absolute top-2 right-2 text-red-400"><User size={16} /></div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        
                        {/* Host Debug */}
                        {isHost && timeLeft <= 0 && (
                            <div className="flex justify-center mt-8">
                                <button onClick={forcePhase} className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-xs font-mono hover:bg-red-500/40 transition">
                                    [ADMIN] FORCE PHASE END
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Role Sidebar (Desktop) / Drawer (Mobile) */}
                    <AnimatePresence>
                        {(showRoleInfo || window.innerWidth > 1024) && (
                            <motion.div 
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 100, opacity: 0 }}
                                className={`
                                    lg:block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-fit
                                    ${showRoleInfo ? 'fixed inset-0 z-50 m-4 lg:static lg:m-0 bg-slate-900/90 lg:bg-white/5' : 'hidden'}
                                `}
                            >
                                <div className="flex justify-between items-center mb-6 lg:hidden">
                                     <h3 className="font-bold text-xl">MISSION INTEL</h3>
                                     <button onClick={() => setShowRoleInfo(false)}><X /></button>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">You Are</h3>
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-105 transition-transform">
                                        <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                            {myPlayer?.role === 'Mafia' ? <Skull size={100} /> : 
                                             myPlayer?.role === 'Doctor' ? <Shield size={100} /> :
                                             myPlayer?.role === 'Detective' ? <Search size={100} /> :
                                             <User size={100} />}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-3xl font-black mb-1">{myPlayer?.role}</div>
                                            <div className="text-xs font-medium text-blue-100 opacity-80 leading-relaxed">
                                                {myPlayer?.role === 'Mafia' && "Eliminate all civilians without getting caught."}
                                                {myPlayer?.role === 'Civilian' && "Find the impostors and vote them out."}
                                                {myPlayer?.role === 'Doctor' && "Protect one innocent soul each night."}
                                                {myPlayer?.role === 'Detective' && "Investigate suspects to reveal their true nature."}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Comms Channel</h3>
                                    <div className="bg-black/30 rounded-xl h-64 flex items-center justify-center text-center p-4 border border-white/5">
                                        <div className="opacity-50 text-sm">
                                            <MessageSquare className="mx-auto mb-2 opacity-50" />
                                            Encrypting transmission...<br/>
                                            <span className="text-xs text-white/30">(Chat not available in this demo)</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            
            {/* GAME OVER VIEW */}
            {room.status === 'FINISHED' && (
                 <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                        <Crown size={80} className="text-yellow-400 mx-auto mb-6" />
                        <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8 drop-shadow-lg">
                            {room.gameState.nightResults?.message || 'GAME OVER'}
                        </h1>
                        <button onClick={() => router.push('/')} className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition">
                            RETURN TO BASE
                        </button>
                    </motion.div>
                 </div>
            )}

        </main>
    </div>
  );
}
