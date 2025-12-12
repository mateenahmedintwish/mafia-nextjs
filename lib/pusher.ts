import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

// Client-side Pusher instance (factory function usually better for React context or just direct usage)
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// Helper to broadcast events
export async function broadcastPhaseChange(roomId: string, phase: string, dayNumber: number, extraData?: any) {
    await pusherServer.trigger(`room-${roomId}`, 'phase-change', {
        phase,
        dayNumber,
        timestamp: Date.now(),
        ...extraData
    });
}

export async function broadcastGameUpdate(roomId: string) {
    await pusherServer.trigger(`room-${roomId}`, 'game-update', {
        timestamp: Date.now()
    });
}
