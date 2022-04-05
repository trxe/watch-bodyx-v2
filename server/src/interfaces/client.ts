import { User } from "./users";

export interface Client {
    user: User,
    socketId: string,
    roomName: string
}