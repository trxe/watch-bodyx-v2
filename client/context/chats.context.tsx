import { createContext, useContext, useState } from "react";
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { IRoom } from "../containers/Rooms"
import { useSockets } from "./socket.context";

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
        console.log("mesage update", this.messages, 'at room', this.room);
    }
}

interface IChatRoomContext {
    chatRooms?: Map<string, ChatRoom> // key = chatRoom name, value = chatRoom
    chatWithAdmins?: ChatRoom // SM_ROOM
    currentChatRoom?: ChatRoom
    chatRoomName: string
    isViewerChatEnabled: boolean
    selectChatRoomName: Function
    setChatRooms: Function
    setViewerChatEnabled: Function
}

const ChatRoomContext = createContext<IChatRoomContext>({
    chatRooms: new Map<string, ChatRoom>(),
    chatWithAdmins: null,
    currentChatRoom: null,
    chatRoomName: 'test',
    isViewerChatEnabled: false,
    selectChatRoomName: () => false,
    setChatRooms: () => false,
    setViewerChatEnabled: () => false
});


const ChatRoomProvider = (props: any) => {
    const [chatRoomName, setChatRoomName] = useState(CHANNELS.SM_ROOM);
    const [chatWithAdmins] = useState(new ChatRoom(null, CHANNELS.SM_ROOM));
    const [chatRooms] = useState(new Map<string, ChatRoom>()); // identifier, room
    const [isViewerChatEnabled, setViewerChatEnabled] = useState(false);
    const {socket, show} = useSockets();

    chatRooms.set(chatWithAdmins.channelName, chatWithAdmins);

    const setChatRooms = (rooms: Array<IRoom>): Map<string, ChatRoom> => {
        if (!chatRooms.has(CHANNELS.MAIN_ROOM)) {
            chatRooms.set(CHANNELS.MAIN_ROOM, new ChatRoom(null, CHANNELS.MAIN_ROOM));
        }
        console.log('rooms passed in', rooms);
        if (rooms == null || rooms.length == 0) return chatRooms;
        rooms.forEach(room => {
            if (!chatRooms.has(room.roomName)) {
                chatRooms.set(room.roomName, new ChatRoom(room, CHANNELS.MAIN_ROOM));
            }
        });
        return chatRooms;
    }

    const selectChatRoomName = (roomName: string) => {
        if (!chatRooms.has(roomName)) {
            chatRooms.set(roomName, 
                new ChatRoom(show.rooms.find(room => room.roomName === roomName), CHANNELS.MAIN_ROOM));
        }
        setChatRoomName(roomName);
    }

    socket.off(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT)
        .on(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT, ({status}) => {
            console.log("viewer", status);
            setViewerChatEnabled(status);
        });

    return <ChatRoomContext.Provider 
        value={{
            chatRooms,
            chatWithAdmins,
            chatRoomName,
            currentChatRoom: chatRooms.get(chatRoomName),
            isViewerChatEnabled,
            selectChatRoomName,
            setChatRooms,
            setViewerChatEnabled
        }} 
        {...props}
    />
}

export const useChatRooms = () => useContext(ChatRoomContext);

export default ChatRoomProvider;