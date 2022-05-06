// A timestamped chat message

export interface Message {
    _id: string,
    userName: string,
    fromSocketId: string,
    sendTo: Array<string>,
    timestamp: string, // ISO
    contents: string,
    isPinned: boolean,
}