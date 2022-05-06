// A timestamped chat message

export interface Message {
    _id: string,
    userName: string,
    fromSocketId: string,
    sendTo: string,
    timestamp: string, // ISO
    contents: string,
    isPrivate: boolean,
    isPinned: boolean,
}