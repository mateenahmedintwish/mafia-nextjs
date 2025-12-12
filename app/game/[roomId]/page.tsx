'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { IPlayer, IRoom } from '@/models/Room';

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [ timeLeft, setTimeLeft ] = useState<number>(0);
  const [ statusMessage, setStatusMessage ] = useState('');
  
  // Local state for actions
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);

  useEffect(() => {
    const pid = sessionStorage.getItem('mafia_playerId');
    if (!pid) {
      router.push('/');
      return;
    }
    setPlayerId(pid);

    // Initial Fetch
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

  // Timer Logic
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
          // If master/host or random client, trigger phase change?
          // Ideally rely on server, but server needs trigger.
          // Let's have the current player trigger if they are host or valid.
          // For simplicity, anyone with < 0 can try trigger.
          if (currentRoom.status === 'ACTIVE' && diff < -2 && !hasActed) { 
              // triggerProcessPhase(); 
              // Prevent spam: maybe only if I am the first player in list?
          }
      } else {
          setTimeLeft(diff);
      }
  };

  // Pusher Subscription
  useEffect(() => {
    if (!playerId || !roomId) return;

    // Configure Auth params dynamically
    (pusherClient as any).config.auth = {
        params: { playerId }
    };
    
    // Subscribe to presence channel
    const channel = pusherClient.subscribe(`presence-${roomId}`);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Connected to game channel');
    });

    channel.bind('player-joined', (player: IPlayer) => {
      setRoom((prev: any) => {
          if (!prev) return null;
          // Avoid duplicates
          if (prev.players.find((p: any) => p.playerId === player.playerId)) return prev;
          return { ...prev, players: [...prev.players, player] };
      });
    });

    channel.bind('game-started', (data: { gameState: any }) => {
        // Refetch to get roles securely
        fetch(`/api/game/${roomId}?playerId=${playerId}`)
            .then(res => res.json())
            .then(d => {
                if (d.success) setRoom(d.room);
            });
    });

    channel.bind('phase-change', (data: { gameState: any, players: IPlayer[] }) => {
        // We can update state directly or refetch. Refetch is safer for info hiding.
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

    channel.bind('vote-update', (data: { votes: any }) => {
        // Optional: show live votes
    });

    return () => {
      pusherClient.unsubscribe(`presence-${roomId}`);
    };
  }, [playerId, roomId]);

  // Actions
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

  // Helper Getters
  const myPlayer = room?.players.find((p: any) => p.playerId === playerId);
  const isHost = room?.players[0]?.playerId === playerId;
  const isDead = myPlayer?.isAlive === false;

  if (loading) return <div className="text-white text-center mt-20">Loading Dungeon...</div>;
  if (!room) return <div className="text-white text-center mt-20">Room not found</div>;

  return (
    <div className={`min-h-screen p-4 text-white ${room.gameState.phase === 'NIGHT' ? 'bg-slate-900' : 'bg-gray-800'}`}>
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-red-500">MAFIA <span className="text-white text-sm opacity-50 ml-2">Room: {roomId}</span></h1>
                <div className="text-sm text-gray-400 mt-1">Status: {room.status} | Phase: {room.gameState.phase}</div>
            </div>
            <div className="text-right">
                <div className="text-xl font-mono">{timeLeft > 0 ? `${timeLeft}s` : '0s'}</div>
                {myPlayer && <div className="text-sm text-green-400">{myPlayer.name} ({myPlayer.role || '???'})</div>}
            </div>
        </header>

        {/* Night Results */}
        {room.gameState.nightResults?.message && (
             <div className="bg-yellow-900/50 border border-yellow-700 p-4 mb-6 rounded text-yellow-200 text-center animate-pulse">
                 {room.gameState.nightResults.message}
             </div>
        )}

        {/* LOBBY VIEW */}
        {room.status === 'LOBBY' && (
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Players ({room.players.length}/{room.settings.maxPlayers})</h2>
                    <ul className="grid grid-cols-2 gap-4">
                        {room.players.map((p: any) => (
                            <li key={p.playerId} className="flex items-center space-x-2 bg-gray-600 p-3 rounded">
                                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-xs">
                                    {p.avatar === 'default' ? '👤' : p.avatar}
                                </div>
                                <span>{p.name} {p.playerId === playerId && '(You)'}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                {isHost && (
                    <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-700 py-4 rounded font-bold text-lg shadow-lg">
                        START GAME
                    </button>
                )}
            </div>
        )}

        {/* GAME OVER VIEW */}
        {room.gameState.phase === 'GAME_OVER' && (
             <div className="text-center mt-20">
                 <h1 className="text-6xl font-bold text-yellow-500 mb-8">{room.gameState.nightResults?.message || 'GAME OVER'}</h1>
                 <button onClick={() => router.push('/')} className="bg-blue-600 px-8 py-3 rounded">Back to Home</button>
             </div>
        )}

        {/* ACTIVE GAME VIEW */}
        {room.status === 'ACTIVE' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Action Area */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Phase Info */}
                    <div className="bg-gray-700 p-6 rounded-lg text-center">
                        {room.gameState.phase === 'NIGHT' ? (
                            <div>
                                <h2 className="text-3xl font-serif text-blue-300 mb-2">Night Phase</h2>
                                {isDead ? <p>You are dead. Watch in silence.</p> :
                                 myPlayer?.role === 'Mafia' ? <p className="text-red-400">Kill a civilian.</p> :
                                 myPlayer?.role === 'Doctor' ? <p className="text-green-400">Choose someone to save.</p> :
                                 myPlayer?.role === 'Detective' ? <p className="text-blue-400">Investigate a suspect.</p> :
                                 <p className="text-gray-400">Sleep safely... hopefully.</p>
                                }
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-3xl font-serif text-yellow-500 mb-2">Day Phase</h2>
                                {isDead ? <p>You are dead.</p> : <p>Discuss and Vote to eliminate the Mafia.</p>}
                            </div>
                        )}
                        
                        {/* Timer Force Button (Debug/Emergency) */}
                         {timeLeft <= 0 && isHost && (
                             <button onClick={forcePhase} className="mt-4 text-xs bg-gray-600 px-2 py-1 rounded">Process Phase</button>
                         )}
                    </div>

                    {/* Players Grid / Action Targets */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {room.players.map((p: any) => {
                            // Filter valid targets?
                            // Logic: Can only select alive players.
                            // If Night:
                            //   Mafia -> Select anyone (except self? usually yes).
                            //   Doctor -> Select anyone.
                            //   Detective -> Select anyone.
                            //   Civilian -> No selection.
                            // If Day:
                            //   Any Alive -> Select Any Alive (except self usually allowed but self-vote is rare).
                            
                            const isSelectable = !isDead && p.isAlive && (
                                (room.gameState.phase === 'DAY') ||
                                (room.gameState.phase === 'NIGHT' && ['Mafia', 'Doctor', 'Detective'].includes(myPlayer?.role || ''))
                            );

                            const isSelected = selectedTarget === p.playerId;

                            return (
                                <button 
                                    key={p.playerId}
                                    disabled={!isSelectable || hasActed}
                                    onClick={() => sendAction(p.playerId)}
                                    className={`
                                        relative p-4 rounded-lg flex flex-col items-center justify-center space-y-2 border-2 transition
                                        ${!p.isAlive ? 'opacity-50 grayscale bg-gray-800 border-gray-700' : 'bg-gray-700 border-gray-600'}
                                        ${isSelected ? 'border-yellow-500 ring-2 ring-yellow-500/50' : ''}
                                        ${isSelectable && !hasActed ? 'hover:bg-gray-600 hover:border-gray-500 cursor-pointer' : 'cursor-default'}
                                    `}
                                >
                                    <div className="text-3xl">{p.avatar === 'default' ? '👤' : p.avatar}</div>
                                    <div className="font-bold">{p.name}</div>
                                    {!p.isAlive && <div className="text-xs text-red-500 uppercase font-black">DEAD</div>}
                                    
                                    {/* Role Reveal if applicable */}
                                    {/* e.g. Mafia sees other Mafia */}
                                    {myPlayer?.role === 'Mafia' && p.role === 'Mafia' && p.playerId !== myPlayer.playerId && (
                                        <div className="text-xs text-red-400 absolute top-2 right-2">MAFIA</div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar (Role Info & Simple Chat Placeholder) */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-400 uppercase text-xs mb-2">Your Role</h3>
                        <div className="text-2xl font-bold mb-2">{myPlayer?.role}</div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {myPlayer?.role === 'Mafia' && "Your goal is to eliminate all civilians. Work with other Mafia members at night."}
                            {myPlayer?.role === 'Civilian' && "Your goal is to find and eliminate the Mafia during the day."}
                            {myPlayer?.role === 'Doctor' && "Wake up at night to protect one player from being killed."}
                            {myPlayer?.role === 'Detective' && "Wake up at night to investigate one player's role."}
                        </p>
                    </div>

                     {/* Chat Placeholder - Actual chat would require more DB fields or ephemeral pusher events */}
                    <div className="bg-gray-700 p-4 rounded-lg h-64 flex flex-col">
                        <h3 className="font-bold text-gray-400 uppercase text-xs mb-2">Game Chat</h3>
                        <div className="flex-1 bg-gray-800 rounded p-2 mb-2 text-sm text-gray-500 flex items-center justify-center">
                            Chat requires Pusher Presence Channel events.
                            (Not fully implemented in this MVP)
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
