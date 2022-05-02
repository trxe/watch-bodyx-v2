import { Client } from "./client";
import { Message } from "./message";
import { Show } from "./show";

/**
 * Class to handle/store (WIP) messages sent during a show.
 */
export class ChatManager {
    show: Show
    publicRoomPins: Map<string, Array<Message>> // key = roomName, value = pinned messages of that room
    privateRooms: Map<string, Client> // key = socketId, value = Client

    constructor(show: Show) {
        this.show = show;
        this.publicRoomPins = new Map<string, Array<Message>>();
        show.rooms.forEach(room => this.publicRoomPins.set(room.roomName, []));
        this.privateRooms = new Map<string, Client>();
    }

}