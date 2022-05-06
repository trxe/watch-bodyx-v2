import Provider from "../provider";
import { Client } from "./client";
import { Message } from "./message";
import { Room } from "./room";
import { Show } from "./show";

class ChatRoom {
    room: Room
    chatName: string
    messages: Array<Message>
    pins: Array<{message: Message, msgIndex: number}>

    constructor(chatName: string, room?: Room) {
        this.room = room;
        this.chatName = chatName;
        this.messages = [];
        this.pins = [];
    }

    public addMessage(message: Message): number {
        const msgIndex = this.messages.length;
        this.messages.push(message);
        this.pins.push({message, msgIndex});
        return msgIndex;
    }

    public pinMessage(msgIndex: number) {
        if (msgIndex >= this.messages.length || msgIndex < 0) 
            throw 'Message not found: index out of bounds';
    }

    public unpinMessage(pinIndex: number) {
        if (pinIndex >= this.pins.length || pinIndex < 0) 
            throw 'Pin not found: index out of bounds';
        const {message, msgIndex} = this.pins.splice(pinIndex, 1)[0];
        this.messages[msgIndex] = {...message, isPinned: false};
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
        show.rooms.forEach(room => this.chatRooms.set(room.roomName, new ChatRoom(room.roomName, room)));
        this.isAudienceChatEnabled = false;
    }

    public clearRooms() {
        this.chatRooms.clear();
    }

    public createPublicChat(room: Room) : void{
        this.chatRooms.set(room.roomName, new ChatRoom(room.roomName, room));
    }

    public createPrivateChat(client: Client) : void{
        this.chatRooms.set(client.socketId, new PrivateChatRoom(client.socketId, ));
    }

    public addMessageToRoom(chatName: string, message: Message): number {
        if (!this.chatRooms.has(chatName)) {
            const roomFound = this.show.rooms.find(room => room.roomName === chatName);
            if (roomFound)  {
                this.createPublicChat(roomFound);
            } else {
                const clientFound = Provider.getClientBySocket(chatName);
                if (clientFound) {
                    this.createPrivateChat(clientFound)
                }
            }
        }
        const chatRoom = this.chatRooms.get(chatName);
        if (!chatRoom) return null;
        return chatRoom.addMessage(message);
    }

    public toggleAudienceChat(status: boolean) {
        this.isAudienceChatEnabled = status;
        return this.isAudienceChatEnabled;
    }
}