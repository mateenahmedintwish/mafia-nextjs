'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Ghost, Users, Play, ArrowRight, Gamepad2, Skull, User as UserIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATARS = ['🕵️‍♂️', '👮‍♂️', '👨‍⚕️', '🧟', '🧛', '🧙', '🤖', '👽', '🤡', '👺', '👻', '💀'];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
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
        body: JSON.stringify({ hostName: name, avatar }),
      });
      const data = await res.json();
      if (data.success) {
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
        body: JSON.stringify({ action: 'join', name, avatar }),
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
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Elements */}
      <motion.div 
        animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-slate-800 opacity-20 pointer-events-none"
      >
        <Ghost size={200} />
      </motion.div>
      <motion.div 
         animate={{ 
            y: [0, 20, 0], 
            rotate: [0, -10, 10, 0] 
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-10 text-slate-800 opacity-20 pointer-events-none"
      >
        <Skull size={200} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
            <motion.h1 
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 tracking-tighter drop-shadow-lg"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
            >
                MAFIA
            </motion.h1>
            <p className="text-slate-400 mt-2 font-mono">Trust No One. Suspect Everyone.</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50">
           
           {/* Name Input */}
            <div className="mb-6 space-y-2">
                <label className="text-slate-300 text-sm font-bold ml-1 flex items-center gap-2">
                    <Ghost size={16} className="text-red-400"/> WHO ARE YOU?
                </label>
                <input
                    type="text"
                    className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-bold text-lg"
                    placeholder="Enter Agent Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* Avatar Selection */}
            <div className="mb-6 space-y-2">
                <label className="text-slate-300 text-sm font-bold ml-1 flex items-center gap-2">
                    <UserIcon size={16} className="text-blue-400"/> CHOOSE DISGUISE
                </label>
                <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((av) => (
                        <button 
                            key={av}
                            onClick={() => setAvatar(av)}
                            className={`
                                text-2xl p-2 rounded-lg transition-all hover:scale-110 hover:bg-white/10
                                ${avatar === av ? 'bg-white/20 scale-110 ring-2 ring-blue-500' : 'opacity-50 hover:opacity-100'}
                            `}
                        >
                            {av}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"
                >
                    <Skull size={16} />
                    {error}
                </motion.div>
            )}

            <div className="space-y-4">
                {/* Create Game Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={createGame}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 transition-all"
                >
                   {loading ? <Users className="animate-pulse" /> : <Play size={20} fill="currentColor" />}
                   CREATE NEW GAME
                </motion.button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-600 text-xs font-bold uppercase">OR JOIN SQUAD</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                {/* Join Game Section */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                        <input
                            type="text"
                            className="w-full p-4 pl-10 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono uppercase tracking-widest text-lg"
                            placeholder="CODE"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={joinGame}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-4 rounded-xl shadow-lg shadow-blue-900/20"
                    >
                        <ArrowRight size={24} />
                    </motion.button>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full text-xs text-slate-500 font-mono">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                SERVER STATUS: ONLINE
             </div>
        </div>
      </motion.div>
    </main>
  );
}
