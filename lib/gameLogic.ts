import { IPlayer } from '@/models/Room';

export function assignRoles(players: IPlayer[], settings: { minPlayers: number }): IPlayer[] {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const totalPlayers = shuffled.length;

    if (totalPlayers < settings.minPlayers) {
        // Cannot start strictly, but we return as is or handle error elsewhere
        // For robust logic, we assume caller checks counts
    }

    // Determine counts
    const mafiaCount = Math.floor(totalPlayers / 4) || 1; // at least 1, or 1 per 4
    const detectiveCount = 1;
    const doctorCount = 1;
    // Civilians = remainder

    let currentIndex = 0;

    // Assign Mafia
    for (let i = 0; i < mafiaCount; i++) {
        if (currentIndex < totalPlayers) {
            shuffled[currentIndex].role = 'Mafia';
            currentIndex++;
        }
    }

    // Assign Detective
    if (currentIndex < totalPlayers) {
        shuffled[currentIndex].role = 'Detective';
        currentIndex++;
    }

    // Assign Doctor
    if (currentIndex < totalPlayers) {
        shuffled[currentIndex].role = 'Doctor';
        currentIndex++;
    }

    // Assign Civilians
    while (currentIndex < totalPlayers) {
        shuffled[currentIndex].role = 'Civilian';
        currentIndex++;
    }

    // Reset states
    return shuffled.map(p => ({
        ...p,
        isAlive: true,
        voteTarget: undefined,
        actionTarget: undefined
    }));
}

export function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
