'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRoomEvents } from '@/hooks/usePusher';

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  role?: string;
}

interface Room {
  id: string;
  code: string;
  status: 'LOBBY' | 'ACTIVE' | 'FINISHED';
  phase?: string;
  dayNumber: number;
  players: Player[];
  minPlayers: number;
  maxPlayers: number;
}

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/game/state?roomId=${roomId}`);
    const data = await res.json();
    if (data.room) setRoom(data.room);
  }, [roomId]);

  useEffect(() => {
    setPlayerId(localStorage.getItem('mafia_playerId'));
    fetchState();
  }, [fetchState]);

  useRoomEvents(roomId, (event, data) => {
    console.log('Event:', event, data);
    // Refresh full state on major events for now to be safe
    // Ideally we optimize to just update local state
    fetchState();
  });

  const copyCode = () => {
    if (room) navigator.clipboard.writeText(room.code);
  };

  if (!room) return <div className="text-white p-10">Loading game...</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
           <h1 className="text-2xl font-bold">Mafia Room</h1>
           <div className="text-gray-400 flex items-center gap-2">
             Code: <span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">{room.code}</span>
             <button onClick={copyCode} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">Copy</button>
           </div>
        </div>
        <div className="text-right">
           <div className="text-xl font-bold text-red-500">{room.status}</div>
           <div>Phase: {room.phase || 'N/A'} (Day {room.dayNumber})</div>
        </div>
      </header>

      {room.status === 'LOBBY' && (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl mb-4">Players ({room.players.length}/{room.maxPlayers})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {room.players.map(p => (
                    <div key={p.id} className="bg-gray-900 p-4 rounded border border-gray-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                            {p.avatar ? p.avatar[0] : '?'}
                        </div>
                        <div>
                            <div className="font-bold">{p.name}</div>
                            {p.id === playerId && <span className="text-xs text-green-500">(You)</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center">
                 {room.players.length < room.minPlayers ? (
                     <div className="text-yellow-500">Waiting for {room.minPlayers - room.players.length} more players to start...</div>
                 ) : (
                    // Only host should see this button ideally, but for MVP we leave it open or check if player is first in list
                     <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded font-bold text-lg">
                         Start Game
                     </button>
                 )}
            </div>
        </div>
      )}

      {room.status === 'ACTIVE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                  {/* Game Board / Phases */}
                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 h-[600px] flex items-center justify-center">
                      <div className="text-center">
                          <h2 className="text-3xl font-bold mb-4">{room.phase}</h2>
                          <p className="text-gray-400">Game logic implementation needed here...</p>
                      </div>
                  </div>
              </div>
              <div>
                   {/* Chat & Logs */}
                   <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-[600px]">
                       <h3 className="font-bold mb-4 border-b border-gray-700 pb-2">Chat</h3>
                       <div className="text-gray-500 text-sm">Chat implementation pending...</div>
                   </div>
              </div>
          </div>
      )}
    </main>
  );
}
