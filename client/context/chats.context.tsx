import { createContext, useContext, useState } from "react";
import { CHANNELS } from "../config/channels";
import { IRoom } from "../containers/Rooms"
import { generateDateBasedID } from "../utils/generateId";

// A timestamped chat message
export interface Message {
    _id: string,
    userName: string,
    fromSocketId: string,
    sendTo: Array<string>,
    timestamp: string // ISO
    contents: string,
    status: 'sending' | 'delivered' | 'received',
}

export class ChatRoom {
    room: IRoom
    channelName: string
    messages: Array<Message>
    pins: Array<Message>

    constructor(room?: IRoom, channelName?: string) {
        this.room = room;
        this.channelName = channelName;
        this.messages = [];
        this.pins = [];
    }

    // Add messages
    public addMessage(message: Message) {
        this.messages.push(message);
    }
}

interface IChatRoomContext {
    chatRooms?: Map<string, ChatRoom> // key = chatRoom name, value = chatRoom
    chatWithAdmins?: ChatRoom // SM_ROOM
    currentChatRoom?: ChatRoom
    chatRoomName: string,
    selectChatRoomName: Function
    setChatRooms: Function
}

const ChatRoomContext = createContext<IChatRoomContext>({
    chatRooms: new Map<string, ChatRoom>(),
    chatWithAdmins: null,
    currentChatRoom: null,
    chatRoomName: 'test',
    selectChatRoomName: () => false,
    setChatRooms: () => false,
});


const ChatRoomProvider = (props: any) => {
    const [chatRoomName, selectChatRoomName] = useState(CHANNELS.SM_ROOM);
    const [chatWithAdmins] = useState(new ChatRoom(null, CHANNELS.SM_ROOM));
    const [chatRooms] = useState(new Map<string, ChatRoom>()); // identifier, room

    chatRooms.set(chatWithAdmins.channelName, chatWithAdmins);

    const setChatRooms = (newShow) => {
        if (newShow.rooms != null) {
            newShow.rooms.forEach(room => {
                if (!chatRooms.has(room.roomName)) 
                    chatRooms.set(room.roomName, new ChatRoom(room, CHANNELS.MAIN_ROOM));
                });
        }
    }

    return <ChatRoomContext.Provider 
        value={{
            chatRooms,
            chatWithAdmins,
            chatRoomName,
            currentChatRoom: chatRooms.get(chatRoomName),
            selectChatRoomName,
            setChatRooms,
        }} 
        {...props}
    />
}

export const useChatRooms = () => useContext(ChatRoomContext);

export default ChatRoomProvider;