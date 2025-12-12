'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createGame = async () => {
    if (!name) return setError('Please enter your name');
    setLoading(true);
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name }),
      });
      const data = await res.json();
      if (data.success) {
        // Save playerId to local storage or session
        sessionStorage.setItem('mafia_playerId', data.playerId);
        router.push(`/game/${data.roomId}`);
      } else {
        setError(data.error || 'Failed to create game');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!name || !roomCode) return setError('Please enter name and room code');
    setLoading(true);
    try {
      const res = await fetch(`/api/game/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', name }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('mafia_playerId', data.playerId);
        router.push(`/game/${data.roomId}`);
      } else {
        setError(data.error || 'Failed to join game');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-red-600 tracking-wider">MAFIA</h1>
      
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-400">Your Name</label>
          <input
            type="text"
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500 transition"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex flex-col space-y-4">
          <button
            onClick={createGame}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create New Game'}
          </button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 uppercase tracking-widest"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinGame}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200 disabled:opacity-50"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
