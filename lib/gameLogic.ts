export type Role = 'MAFIA' | 'DOCTOR' | 'DETECTIVE' | 'CIVILIAN';

interface PlayerSetup {
    id: string;
    role?: Role | null; // Allow null initially, but logic assigns string
}

export function assignRoles(players: PlayerSetup[]): PlayerSetup[] {
    const count = players.length;
    // Fisher-Yates shuffle
    const shuffled = [...players];
    for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Config: 1 Mafia per 4 players (floor), Min 1 Doctor, Min 1 Detective
    const mafiaCount = Math.max(1, Math.floor(count / 4));
    const doctorCount = 1;
    const detectiveCount = 1;
    // Remainder are Civilians

    let idx = 0;

    // Assign Mafia
    for (let i = 0; i < mafiaCount; i++) {
        if (idx < count) shuffled[idx++].role = 'MAFIA';
    }

    // Assign Doctor
    for (let i = 0; i < doctorCount; i++) {
        if (idx < count) shuffled[idx++].role = 'DOCTOR';
    }

    // Assign Detective
    for (let i = 0; i < detectiveCount; i++) {
        if (idx < count) shuffled[idx++].role = 'DETECTIVE';
    }

    // Assign Civilians to the rest
    while (idx < count) {
        shuffled[idx++].role = 'CIVILIAN';
    }

    return shuffled;
}
