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
    sendTo: string,
    timestamp: string, // ISO
    contents: string,
    isPrivate: boolean,
    isPinned: boolean
}

export class ChatRoom {
    room: IRoom
    chatName: string
    messages: Array<Message>
    pins: Array<{message: Message, msgIndex: number}>
    pinMsgIndices: Set<number>
    firstMsgIndex: number
    currMsgIndex: number

    constructor(room?: IRoom, chatName?: string) {
        this.room = room;
        this.chatName = chatName;
        this.messages = [];
        this.pins = [];
        this.pinMsgIndices = new Set<number>();
        this.firstMsgIndex = -1;
        this.currMsgIndex = -1;
    }

    getLocalMsgIndex(msgIndex: number): number {
        if (this.currMsgIndex < 0) return Infinity;
        return msgIndex - this.currMsgIndex;
    }

    nextNewMsgIndexRecv(): number {
        return this.messages.length + this.firstMsgIndex;
    }

    // Add messages
    public addMessage(message: Message, msgIndex: number) {
        if (this.firstMsgIndex < 0) {
            this.firstMsgIndex = msgIndex;
            this.currMsgIndex = msgIndex;
            this.messages.push(message);
            console.log('init', this.messages, 'start from', msgIndex);
        } else if (msgIndex < this.nextNewMsgIndexRecv()) {
            // if this is a missing message OR message to replace
            this.messages[msgIndex - this.firstMsgIndex] = message;
            console.log('filling', this.messages)
        } else {
            // if this is a new message
            for (let i = this.nextNewMsgIndexRecv(); i < msgIndex; i++) {
                this.messages.push(null);
            }
            this.messages.push(message);
            console.log('adding', this.messages)
        }

        // move msg index to last position
        while (this.currMsgIndex < this.nextNewMsgIndexRecv() - 1
            && this.messages[this.currMsgIndex + 1 - this.firstMsgIndex]) {
                this.currMsgIndex += 1;
        }
        console.log('my message list', this.messages)
    }

    public pinMessage(msgIndex: number, pinIndex: number): Message {
        // only pin messages that are in order.
        if (msgIndex > this.currMsgIndex) return null;
        const localMsgIndex = this.getLocalMsgIndex(msgIndex);
        const message = {...this.messages[localMsgIndex], isPinned: true};
        this.messages[localMsgIndex] = message;
        return message;
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

    messages: Array<Message>
    setMessages: Function
    pins: Array<Message>
    setPins: Function
}

const ChatRoomContext = createContext<IChatRoomContext>({
    chatRooms: new Map<string, ChatRoom>(),
    chatWithAdmins: null,
    currentChatRoom: null,
    chatRoomName: 'test',
    isViewerChatEnabled: false,
    selectChatRoomName: () => false,
    setChatRooms: () => false,
    setViewerChatEnabled: () => false,

    messages: [],
    setMessages: () => false,
    pins: [],
    setPins: () => false,
});


const ChatRoomProvider = (props: any) => {
    const [chatRoomName, setChatRoomName] = useState(CHANNELS.SM_ROOM);
    const [chatWithAdmins] = useState(new ChatRoom(null, CHANNELS.SM_ROOM));
    const [chatRooms] = useState(new Map<string, ChatRoom>()); // identifier, room
    const [isViewerChatEnabled, setViewerChatEnabled] = useState(false);
    const [messages, setMessages] = useState([]);
    const [pins, setPins] = useState([]);
    const {socket, show} = useSockets();

    chatRooms.set(chatWithAdmins.chatName, chatWithAdmins);

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
        const currChatRoom = chatRooms.get(roomName);
        setMessages(currChatRoom.messages);
        setPins(currChatRoom.pins);
    }

    if (socket != null) {
        socket.off(EVENTS.SERVER.DELIVER_MESSAGE)
            .on(EVENTS.SERVER.DELIVER_MESSAGE, ({message, msgIndex}) => {
                console.log("message", message, msgIndex);
                // handled by emit's ack
                if (message.fromSocketId === socket.id) 
                    return;
                if (!chatRooms.has(message.sendTo))  {
                    chatRooms.set(message.sendTo, 
                        new ChatRoom(show.rooms.find(room => room.roomName === message.sendTo), CHANNELS.MAIN_ROOM));
                }
                chatRooms.get(message.sendTo).addMessage(message, msgIndex);
                // if this chat is the current chat room
                if (message.sendTo === chatRoomName) {
                    const currChatRoom = chatRooms.get(chatRoomName);
                    setMessages([...currChatRoom.messages]);
                    setPins([...currChatRoom.pins]);
                }
            });

        socket.off(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT)
            .on(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT, ({status}) => {
                console.log("viewer", status);
                setViewerChatEnabled(status);
            });
    }

    return <ChatRoomContext.Provider 
        value={{
            chatRooms,
            chatWithAdmins,
            chatRoomName,
            currentChatRoom: chatRooms.get(chatRoomName),
            isViewerChatEnabled,
            selectChatRoomName,
            setChatRooms,
            setViewerChatEnabled,
            messages,
            setMessages,
            pins,
            setPins
        }} 
        {...props}
    />
}

export const useChatRooms = () => useContext(ChatRoomContext);

export default ChatRoomProvider;