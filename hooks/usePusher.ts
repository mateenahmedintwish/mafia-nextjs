import { useEffect } from 'react';
import Pusher from 'pusher-js';

export function useRoomEvents(roomId: string, onEvent: (event: string, data: any) => void) {
    useEffect(() => {
        // Ensure we only run on client
        if (typeof window === 'undefined') return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe(`room-${roomId}`);

        // Bind to all relevant events
        channel.bind('phase-change', (data: any) => onEvent('phase-change', data));
        channel.bind('player-joined', (data: any) => onEvent('player-joined', data));
        channel.bind('game-update', (data: any) => onEvent('game-update', data));
        // Add more as needed

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`room-${roomId}`);
        };
    }, [roomId, onEvent]);
}
