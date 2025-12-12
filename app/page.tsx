'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoin, setIsJoin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return alert('Enter name');
    setLoading(true);
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        body: JSON.stringify({ playerName: name }),
      });
      const data = await res.json();
      if (data.roomId) {
        localStorage.setItem('mafia_playerId', data.playerId); // Simple persistence
        localStorage.setItem('mafia_playerName', name);
        router.push(`/lobby/${data.roomId}`);
      }
    } catch (e) {
      alert('Error creating game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name || !roomCode) return alert('Enter name and code');
    setLoading(true);
    try {
      const res = await fetch('/api/game/join', {
         method: 'POST',
         body: JSON.stringify({ roomCode, playerName: name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      localStorage.setItem('mafia_playerId', data.playerId);
      localStorage.setItem('mafia_playerName', name);
      router.push(`/lobby/${data.roomId}`);
    } catch (e: any) {
      alert(e.message || 'Error joining game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <h1 className="text-6xl font-bold mb-8 tracking-tighter text-red-600">MAFIA</h1>
      
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your Name</label>
          <input 
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Enter your name"
          />
        </div>

        {!isJoin ? (
            <button 
                onClick={handleCreate} 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition"
            >
                {loading ? 'Creating...' : 'Create New Game'}
            </button>
        ) : (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Room Code</label>
                    <input 
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white uppercase"
                        value={roomCode} 
                        onChange={e => setRoomCode(e.target.value)} 
                        placeholder="Last 6 chars"
                        maxLength={6}
                    />
                </div>
                <button 
                    onClick={handleJoin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
                >
                    {loading ? 'Joining...' : 'Join Game'}
                </button>
            </div>
        )}

        <div className="flex justify-center text-sm text-gray-400 mt-4">
            <button onClick={() => setIsJoin(!isJoin)} className="hover:text-white underline">
                {isJoin ? 'Or create a new room' : 'Or join an existing room'}
            </button>
        </div>
      </div>
    </main>
  );
}
