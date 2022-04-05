import { ObjectId } from "mongodb";

export interface Room {
    _id: ObjectId,
    name: string,
    url: string,
    isLocked: boolean,
    chatRoomName: string
}