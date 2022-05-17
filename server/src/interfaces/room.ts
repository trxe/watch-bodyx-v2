import { ObjectId } from "mongodb";

export interface Room {
    _id: ObjectId,
    name: string,
    url: string,
    isLocked: boolean,
    // roomName used by Socket.io to identify which chat room to communicate to
    roomName: string
}