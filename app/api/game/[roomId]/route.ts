import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { pusherServer } from '@/lib/pusher';
import { assignRoles } from '@/lib/gameLogic';

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const { roomId } = await params;
        await dbConnect();

        const body = await req.json();
        const { action } = body;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        if (action === 'join') {
            const { name, avatar } = body;
            const playerId = crypto.randomUUID();

            const newPlayer = {
                playerId,
                name,
                avatar: avatar || 'default',
                isConnected: true,
                isAlive: true
            };

            room.players.push(newPlayer);
            await room.save();

            await pusherServer.trigger(`presence-${roomId}`, 'player-joined', newPlayer);

            return NextResponse.json({ success: true, playerId, room });
        }

        if (action === 'start') {
            const { playerId } = body; // Host ID check could be implemented
            if (room.players.length < room.settings.minPlayers) {
                // return NextResponse.json({ success: false, error: 'Not enough players' }, { status: 400 });
                // Allow for testing
            }

            const updatedPlayers = assignRoles(room.players, room.settings);
            room.players = updatedPlayers;
            room.status = 'ACTIVE';
            room.gameState.phase = 'NIGHT';
            room.gameState.dayNumber = 1;
            room.gameState.phaseEndTime = new Date(Date.now() + room.settings.nightTimer * 1000);

            await room.save();

            // Broadcast game start
            await pusherServer.trigger(`presence-${roomId}`, 'game-started', {
                gameState: room.gameState
            });

            // Send individual roles (Private channels or selective event data)
            // Ideally we use private channels. For simplicity in this demo, we can rely on 
            // the client knowing its ID and the 'game-started' event could technically 
            // imply a fetch to get your own role securely, OR we broadcast a "roles-assigned" 
            // event where each client filters? No, that exposes roles.
            // We can trigger an event per user on a private channel `private-user-[playerId]`
            // But for this MVP, let's assume the client re-fetches the room state securely 
            // (but room state shouldn't expose all roles to everyone).
            // WE NEED A GET ROUTE that filters data based on playerId.

            return NextResponse.json({ success: true, room });
        }

        if (action === 'night-action') {
            const { playerId, targetId } = body;
            // Validate player is alive and has correct role
            const player = room.players.find((p: any) => p.playerId === playerId);
            if (!player || !player.isAlive) {
                return NextResponse.json({ success: false, error: 'Invalid player' }, { status: 400 });
            }

            // Update target
            player.actionTarget = targetId;
            await room.save();

            // Check if all active roles have acted? (Optimization: trigger phase change early)
            // For now, wait for timer or explicit trigger
            return NextResponse.json({ success: true });
        }

        if (action === 'vote') {
            const { playerId, targetId } = body;
            const player = room.players.find((p: any) => p.playerId === playerId);
            if (!player || !player.isAlive || room.gameState.phase !== 'DAY') {
                return NextResponse.json({ success: false, error: 'Invalid vote' }, { status: 400 });
            }

            player.voteTarget = targetId;
            await room.save();

            // Check majority
            const alivePlayers = room.players.filter((p: any) => p.isAlive);
            const votes = alivePlayers.reduce((acc: any, p: any) => {
                if (p.voteTarget) {
                    acc[p.voteTarget] = (acc[p.voteTarget] || 0) + 1;
                }
                return acc;
            }, {});

            const majority = Math.floor(alivePlayers.length / 2) + 1;
            let lynchedId = null;

            for (const [target, count] of Object.entries(votes)) {
                if ((count as number) >= majority) {
                    lynchedId = target;
                    break;
                }
            }

            if (lynchedId) {
                // Execute Lynch
                const victim = room.players.find((p: any) => p.playerId === lynchedId);
                if (victim) {
                    victim.isAlive = false;

                    // Check Win Condition
                    const aliveMafia = room.players.filter((p: any) => p.isAlive && p.role === 'Mafia').length;
                    const aliveCivilians = room.players.filter((p: any) => p.isAlive && p.role !== 'Mafia').length;

                    let newPhase = 'NIGHT';
                    if (aliveMafia === 0) {
                        room.status = 'FINISHED';
                        room.gameState.phase = 'GAME_OVER';
                        room.gameState.nightResults = { message: 'Civilians Win!' };
                    } else if (aliveMafia >= aliveCivilians) {
                        room.status = 'FINISHED';
                        room.gameState.phase = 'GAME_OVER';
                        room.gameState.nightResults = { message: 'Mafia Wins!' };
                    } else {
                        room.gameState.phase = 'NIGHT';
                        room.gameState.dayNumber += 1;
                        room.gameState.phaseEndTime = new Date(Date.now() + room.settings.nightTimer * 1000);
                        // Clear targets
                        room.players.forEach((p: any) => { p.voteTarget = undefined; p.actionTarget = undefined; });
                        room.gameState.nightResults = { message: `${victim.name} was lynched.` };
                    }

                    await room.save();
                    await pusherServer.trigger(`presence-${roomId}`, 'phase-change', {
                        gameState: room.gameState,
                        players: room.players // Or masked version
                    });
                    return NextResponse.json({ success: true, processed: true });
                }
            }

            await pusherServer.trigger(`presence-${roomId}`, 'vote-update', { votes });
            return NextResponse.json({ success: true });
        }

        if (action === 'process-phase') {
            // Called when timer expires
            const now = new Date();
            // Allow a small buffer or strict check? 
            // if (room.gameState.phaseEndTime && new Date(room.gameState.phaseEndTime) > now) {
            //    return NextResponse.json({ success: false, error: 'Timer not expired' });
            // }

            if (room.gameState.phase === 'NIGHT') {
                // Process Night Actions
                // 1. Calculate Mafia Kill
                const mafia = room.players.filter((p: any) => p.role === 'Mafia' && p.isAlive);
                // Simple logic: Majority target or first target
                const mafiaVotes: { [key: string]: number } = {};
                mafia.forEach((p: any) => {
                    if (p.actionTarget) mafiaVotes[p.actionTarget] = (mafiaVotes[p.actionTarget] || 0) + 1;
                });
                // Pick max
                let killTargetId: string | null = null;
                let maxVotes = 0;
                for (const [target, count] of Object.entries(mafiaVotes)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        killTargetId = target;
                    }
                }

                // 2. Doctor Save
                const doctors = room.players.filter((p: any) => p.role === 'Doctor' && p.isAlive);
                const savedIds: string[] = [];
                doctors.forEach((d: any) => {
                    if (d.actionTarget) savedIds.push(d.actionTarget);
                });

                // 3. Resolve
                let message = "No one died last night.";
                if (killTargetId && !savedIds.includes(killTargetId)) {
                    const victim = room.players.find((p: any) => p.playerId === killTargetId);
                    if (victim) {
                        victim.isAlive = false;
                        message = `${victim.name} was killed last night.`;
                    }
                } else if (killTargetId && savedIds.includes(killTargetId)) {
                    message = "Someone was attacked but saved!";
                }

                // Check Win Condition (Mafia >= Civilians)
                const aliveMafia = room.players.filter((p: any) => p.isAlive && p.role === 'Mafia').length;
                const aliveCivilians = room.players.filter((p: any) => p.isAlive && p.role !== 'Mafia').length;

                if (aliveMafia >= aliveCivilians) {
                    room.status = 'FINISHED';
                    room.gameState.phase = 'GAME_OVER';
                    room.gameState.nightResults = { message: 'Mafia Wins!' };
                } else {
                    room.gameState.phase = 'DAY';
                    room.gameState.phaseEndTime = new Date(Date.now() + room.settings.dayTimer * 1000);
                    room.gameState.nightResults = { message };
                    // Clear targets
                    room.players.forEach((p: any) => { p.actionTarget = undefined; p.voteTarget = undefined; });
                }

                await room.save();
                await pusherServer.trigger(`presence-${roomId}`, 'phase-change', {
                    gameState: room.gameState
                });

                return NextResponse.json({ success: true, message });
            }

            if (room.gameState.phase === 'DAY') {
                // Timer ran out without majority lynch
                room.gameState.phase = 'NIGHT';
                room.gameState.dayNumber += 1;
                room.gameState.phaseEndTime = new Date(Date.now() + room.settings.nightTimer * 1000);
                room.gameState.nightResults = { message: 'No one was lynched today.' };
                // Clear targets
                room.players.forEach((p: any) => { p.voteTarget = undefined; p.actionTarget = undefined; });
                await room.save();
                await pusherServer.trigger(`presence-${roomId}`, 'phase-change', {
                    gameState: room.gameState
                });
                return NextResponse.json({ success: true, message: 'Day ended without lynch' });
            }
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error in game route:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    // Helper to get room state. 
    // Secure handling: if query param ?playerId=... is present, return role for that player.
    // Mask other players' roles.

    // NOTE: In Next.js App Router, searchParams is passed or we get it from req.url
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    await dbConnect();
    const room = await Room.findOne({ roomId });

    if (!room) return NextResponse.json({ success: false }, { status: 404 });

    const roomObj = room.toObject();

    // Mask roles if game is active and not finished
    if (roomObj.status === 'ACTIVE') {
        roomObj.players = roomObj.players.map((p: any) => {
            if (p.playerId === playerId) {
                return p; // Return full info for self
            }
            if (!p.isAlive && roomObj.settings.roleRevealOnElimination) {
                return p; // Reveal role if dead and setting is on
            }
            // Mask role
            const { role, voteTarget, actionTarget, ...rest } = p;
            return rest;
        });
    }

    return NextResponse.json({ success: true, room: roomObj });
}
