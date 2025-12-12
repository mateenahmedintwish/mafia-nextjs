import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { generateRoomCode } from '@/lib/gameLogic';

export async function POST(req: Request) {
    try {
        await dbConnect();

        // Generate unique room code
        let roomId = generateRoomCode();
        let existing = await Room.findOne({ roomId });
        while (existing) {
            roomId = generateRoomCode();
            existing = await Room.findOne({ roomId });
        }

        const body = await req.json();
        // Host defaults
        const hostPlayer = {
            playerId: crypto.randomUUID(),
            name: body.hostName || 'Host',
            avatar: body.avatar || 'default',
            isConnected: true,
            isAlive: true
        };

        const newRoom = await Room.create({
            roomId,
            status: 'LOBBY',
            players: [hostPlayer],
            settings: {
                minPlayers: 6,
                maxPlayers: 15,
                roleRevealOnElimination: true,
                dayTimer: 60,
                nightTimer: 30
            }
        });

        return NextResponse.json({
            success: true,
            roomId,
            playerId: hostPlayer.playerId,
            room: newRoom
        });

    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
