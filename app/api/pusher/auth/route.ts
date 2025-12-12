import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    const data = await req.formData();
    const socketId = data.get('socket_id') as string;
    const channel = data.get('channel_name') as string;
    const playerId = data.get('playerId') as string;

    // Validate request
    if (!socketId || !channel) {
        return new NextResponse('Missing socket_id or channel_name', { status: 400 });
    }

    const presenceData = {
        user_id: playerId || crypto.randomUUID(),
        user_info: {
            name: 'Player', // Ideally fetch name from DB using playerId
        },
    };

    try {
        const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error('Pusher auth error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
