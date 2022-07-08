import { Client } from "./client";
import { Message } from "./message";
import { Room } from "./room";
import { Show } from "./show";

class ChatRoom {
    room: Room
    chatName: string
    messages: Array<Message>
    pinMsgIndices: Set<number>

    constructor(chatName: string, room?: Room) {
        this.room = room;
        this.chatName = chatName;
        this.messages = [];
        this.pinMsgIndices = new Set<number>();
    }

    public getPinsList(): Array<{msgIndex: number, message: Message}> {
        return Array.from(this.pinMsgIndices)
            .map(msgIndex => {
                return {msgIndex, message: this.messages[msgIndex]};
            });
    }

    public addMessage(message: Message): number {
        const msgIndex = this.messages.length;
        this.messages.push(message);
        return msgIndex;
    }

    public pinMessage(msgIndex: number): Message {
        if (msgIndex >= this.messages.length || msgIndex < 0) 
            throw 'Message not found: index out of bounds';
        this.pinMsgIndices.add(msgIndex);
        return this.messages[msgIndex];
    }

    public unpinMessage(msgIndex: number): Message {
        if (msgIndex >= this.messages.length || msgIndex < 0) 
            throw 'Message not found: index out of bounds';
        this.pinMsgIndices.delete(msgIndex);
        return this.messages[msgIndex];
    }
}

class PrivateChatRoom extends ChatRoom {
    client: Client

    constructor (chatName: string, client? : Client) {
        super(chatName);
        this.client = client;
    }
}

/**
 * Class to handle/store (WIP) messages sent during a show.
 */
export class ChatManager {
    show: Show
    isAudienceChatEnabled: boolean
    chatRooms: Map<string, ChatRoom>

    constructor(show: Show) {
        this.show = show;
        this.chatRooms = new Map<string, ChatRoom>();
        this.isAudienceChatEnabled = false;
        if (!show.rooms) return;
        show.rooms.forEach(room => this.chatRooms.set(room.roomName, new ChatRoom(room.roomName, room)));
    }

    public clearRooms(roomName?: string) {
        if (!roomName) {
            this.chatRooms.clear();
        } else {
            this.chatRooms.delete(roomName);
        }
    }

    public getPinList(roomName?: string) {
        if (roomName != null) {
            if (!this.chatRooms.has(roomName)) return null;
            return {
                chatName: roomName,
                pinList: this.chatRooms.get(roomName).getPinsList()
            }
        }
        return Array.from(this.chatRooms.entries())
            .map(chatRoomData => {
                return {
                    chatName: chatRoomData[0],
                    pinList: chatRoomData[1].getPinsList()
                }
            });
    }

    public createPublicChat(room: Room): void {
        this.chatRooms.set(room.roomName, new ChatRoom(room.roomName, room));
    }

    public createPrivateChat(client: Client): void {
        this.chatRooms.set(client.socketId, new PrivateChatRoom(client.socketId, client));
    }

    public hasRoom(chatName: string): boolean {
        return this.chatRooms.has(chatName);
    }

    public addMessageToRoom(chatName: string, message: Message): number {
        const chatRoom = this.chatRooms.get(chatName);
        if (!chatRoom) return null;
        return chatRoom.addMessage(message);
    }

    public pinMessageInRoom(chatName: string, msgIndex: number): Message {
        const chatRoom = this.chatRooms.get(chatName);
        if (!chatRoom) return null;
        return chatRoom.pinMessage(msgIndex);
    }

    public unpinMessageInRoom(chatName: string, msgIndex: number): Message {
        const chatRoom = this.chatRooms.get(chatName);
        if (!chatRoom) return null;
        return chatRoom.unpinMessage(msgIndex);
    }

    public toggleAudienceChat(status: boolean) {
        this.isAudienceChatEnabled = status;
        return this.isAudienceChatEnabled;
    }
}