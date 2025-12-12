import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    try {
        const { roomCode, playerName, avatar } = await req.json();

        if (!roomCode || !playerName) {
            return NextResponse.json({ error: 'Room code and player name are required' }, { status: 400 });
        }

        // Find room
        const room = await prisma.room.findUnique({
            where: { code: roomCode.toUpperCase() },
            include: { players: true }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (room.status !== 'LOBBY') {
            return NextResponse.json({ error: 'Game has already started' }, { status: 403 });
        }

        if (room.players.length >= room.maxPlayers) {
            return NextResponse.json({ error: 'Room is full' }, { status: 403 });
        }

        // Check for duplicate name
        const nameExists = room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (nameExists) {
            return NextResponse.json({ error: 'Name already taken in this room' }, { status: 409 });
        }

        // Add player
        const player = await prisma.player.create({
            data: {
                name: playerName,
                avatar: avatar || 'default',
                roomId: room.id,
            }
        });

        // Notify others via Pusher
        await pusherServer.trigger(`room-${room.id}`, 'player-joined', {
            player
        });

        return NextResponse.json({
            roomId: room.id,
            playerId: player.id
        });

    } catch (error) {
        console.error('Error joining game:', error);
        return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
    }
}
