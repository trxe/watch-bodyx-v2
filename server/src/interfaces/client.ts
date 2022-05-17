import { User } from "./users";

export interface Client {
    user: User,
    socketId: string,
    // CHANNELS are app-wide communication outlets (MAIN_ROOM, WAITING_ROOM).
    channelName: string,
    // ROOMS are show-specific rooms.
    roomName?: string
}