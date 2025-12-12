import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
    playerId: string;
    name: string;
    avatar: string;
    isConnected: boolean;
    role?: 'Mafia' | 'Civilian' | 'Detective' | 'Doctor';
    isAlive: boolean;
    voteTarget?: string;
    actionTarget?: string;
    isReady?: boolean;
}

export interface IRoom extends Document {
    roomId: string;
    status: 'LOBBY' | 'ACTIVE' | 'FINISHED';
    players: IPlayer[];
    settings: {
        minPlayers: number;
        maxPlayers: number;
        roleRevealOnElimination: boolean;
        dayTimer: number;
        nightTimer: number;
    };
    gameState: {
        phase: 'LOBBY' | 'NIGHT' | 'DAY' | 'GAME_OVER';
        dayNumber: number;
        phaseEndTime?: Date;
        nightResults?: {
            message: string;
        };
    };
    createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
    playerId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    isConnected: { type: Boolean, default: true },
    role: { type: String, enum: ['Mafia', 'Civilian', 'Detective', 'Doctor'] },
    isAlive: { type: Boolean, default: true },
    voteTarget: { type: String },
    actionTarget: { type: String },
    isReady: { type: Boolean, default: false }
});

const RoomSchema = new Schema<IRoom>({
    roomId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['LOBBY', 'ACTIVE', 'FINISHED'], default: 'LOBBY' },
    players: [PlayerSchema],
    settings: {
        minPlayers: { type: Number, default: 6 },
        maxPlayers: { type: Number, default: 15 },
        roleRevealOnElimination: { type: Boolean, default: true },
        dayTimer: { type: Number, default: 60 },
        nightTimer: { type: Number, default: 30 }
    },
    gameState: {
        phase: { type: String, enum: ['LOBBY', 'NIGHT', 'DAY', 'GAME_OVER'], default: 'LOBBY' },
        dayNumber: { type: Number, default: 0 },
        phaseEndTime: { type: Date },
        nightResults: {
            message: String
        }
    },
}, { timestamps: true });

// Check if model is already defined to prevent OverwriteModelError
const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
