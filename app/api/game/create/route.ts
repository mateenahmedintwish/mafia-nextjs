import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
    try {
        const { playerName, avatar } = await req.json();

        if (!playerName) {
            return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
        }

        // Generate unique 6-char room code
        const roomCode = randomBytes(3).toString('hex').toUpperCase();

        // Create Room and Host Player in a transaction
        const room = await prisma.room.create({
            data: {
                code: roomCode,
                status: 'LOBBY',
                players: {
                    create: {
                        name: playerName,
                        avatar: avatar || 'default',
                        isAlive: true,
                    }
                }
            },
            include: {
                players: true
            }
        });

        const hostPlayer = room.players[0];

        return NextResponse.json({
            roomCode: room.code,
            roomId: room.id,
            playerId: hostPlayer.id
        });

    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }
}
