import { createContext, useContext, useEffect, useState } from "react";
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { MODES } from "../config/modes";
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
    pins: Map<number, Message>
    firstMsgIndex: number
    currMsgIndex: number

    constructor(room?: IRoom, chatName?: string) {
        this.room = room;
        this.chatName = chatName;
        this.messages = [];
        this.pins = new Map<number, Message>();
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

    public serverMsgIndex(localMsgIndex: number) : number {
        if (this.currMsgIndex < 0) return -1;
        return localMsgIndex + this.firstMsgIndex;
    }

    // Add messages
    public addMessage(message: Message, msgIndex: number) {
        if (this.firstMsgIndex < 0) {
            this.firstMsgIndex = msgIndex;
            this.currMsgIndex = msgIndex;
            this.messages.push(message);
        } else if (msgIndex < this.nextNewMsgIndexRecv()) {
            // if this is a missing message OR message to replace
            this.messages[msgIndex - this.firstMsgIndex] = message;
        } else {
            // if this is a new message
            for (let i = this.nextNewMsgIndexRecv(); i < msgIndex; i++) {
                this.messages.push(null);
            }
            this.messages.push(message);
        }

        // move msg index to last position
        while (this.currMsgIndex < this.nextNewMsgIndexRecv() - 1
            && this.messages[this.currMsgIndex + 1 - this.firstMsgIndex]) {
                this.currMsgIndex += 1;
        }
    }

    public pinMessage(msgIndex: number, message: Message) {
        this.pins.set(msgIndex, message);
        if (msgIndex > this.firstMsgIndex && this.currMsgIndex > 0 && this.currMsgIndex > msgIndex) {
            const localMsgIndex = msgIndex - this.firstMsgIndex;
            const updateMsg = {...this.messages[localMsgIndex], isPinned: true};
            this.messages[localMsgIndex] = updateMsg;
        }
    }

    public unpinMessage(msgIndex: number, message: Message) {
        if (this.pins.delete(msgIndex)) {
            if (msgIndex > this.firstMsgIndex && this.currMsgIndex > 0 && this.currMsgIndex > msgIndex) {
                const localMsgIndex = msgIndex - this.firstMsgIndex;
                const updateMsg = {...this.messages[localMsgIndex], isPinned: false};
                this.messages[localMsgIndex] = updateMsg;
            }
        }
    }
}

export class UnreadCountManager {
    qnaRooms: Map<string, number>;
    qnaTotal: number
    theatreRooms: Map<string, number>;
    theatreTotal: number

    constructor() {
        this.qnaRooms = new Map<string, number>();
        this.theatreRooms = new Map<string, number>();
        this.qnaTotal = 0;
        this.theatreTotal = 0;
    }

    public addRoom(roomName: string, mode: string, count?: number) {
        if (mode === MODES.QNA) {
            this.qnaRooms.set(roomName, !count ? 0 : count);
            if (count) this.qnaTotal += count;
        } else if (mode === MODES.THEATRE) {
            this.theatreRooms.set(roomName, !count ? 0 : count);
            if (count) this.theatreTotal += count;
        }
    }

    public getRoomMode(roomName: string): string {
        if (this.qnaRooms.has(roomName)) return MODES.QNA;
        if (this.theatreRooms.has(roomName)) return MODES.THEATRE;
        return null;
    }

    public hasRoom(roomName: string): boolean {
        return this.getRoomMode(roomName) != null;
    }

    public incrementRoomUnread(roomName: string) {
        if (this.qnaRooms.has(roomName)) {
            this.qnaTotal += 1;
            this.qnaRooms.set(roomName,this.qnaRooms.get(roomName) + 1);
        } else if (this.theatreRooms.has(roomName)) {
            this.theatreTotal += 1;
            this.theatreRooms.set(roomName,this.theatreRooms.get(roomName) + 1);
        }
    }

    public clearRoomUnreads(roomName: string) {
        const mode = this.getRoomMode(roomName);
        if (mode === MODES.QNA) {
            this.qnaTotal -= this.qnaRooms.get(roomName);
            this.qnaRooms.delete(roomName);
        } else  if (mode === MODES.THEATRE) {
            this.theatreTotal -= this.theatreRooms.get(roomName);
            this.theatreRooms.delete(roomName);
        }
    }

    public getObject(): { [key: string]: number; } {
        return {
            ...Object.fromEntries(this.qnaRooms), 
            ...Object.fromEntries(this.theatreRooms), 
            [MODES.QNA]: this.qnaTotal,
            [MODES.THEATRE]: this.theatreTotal
        };
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
    updateMessageList: Function
    pins: Array<any>
    updatePinList: Function
    unreadCounts: Object,
    clearUnreadRoom: Function
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
    updateMessageList: () => false,
    pins: [],
    updatePinList: () => false,
    unreadCounts: {},
    clearUnreadRoom: () => false,
});


const ChatRoomProvider = (props: any) => {
    const {socket, channel, user, show, clientsList} = useSockets();
    const [chatRoomName, setChatRoomName] = useState(CHANNELS.SM_ROOM);
    const [chatWithAdmins, setChatWithAdmins] = useState(null);
    const [chatRooms] = useState(new Map<string, ChatRoom>()); // identifier, room
    const [isViewerChatEnabled, setViewerChatEnabled] = useState(false);
    const [messages, setMessages] = useState([]);
    const [pins, setPins] = useState([]);

    const [unreadCountManager, updateUnreadCountManager] = useState(new UnreadCountManager());
    const [unreadCounts, setUnreadCounts] = useState(unreadCountManager.getObject());

    const [isFirstLoad, setFirstLoad] = useState(true);

    const requestPinLists = () => {
        socket.emit(EVENTS.CLIENT.GET_INFO, {request: 'all_pins'});
    }

    useEffect(() => {
        if (!isFirstLoad || !show || !socket) return;
        console.log('first chatroom load');
        const hasRooms = setChatRooms(show.rooms) != null;
        if (hasRooms) {
            requestPinLists();
            setFirstLoad(false);
        }
    }, [show])

    const setChatRooms = (rooms: Array<IRoom>): Map<string, ChatRoom> => {
        // PM room
        if (!user || !socket) return;
        if (!chatRooms.has(socket.id) && !user.isAdmin) {
            const waitingRoomChat = new ChatRoom(null, socket.id);
            setChatWithAdmins(waitingRoomChat)
            chatRooms.set(socket.id, waitingRoomChat);
        }
        if (rooms == null || rooms.length == 0) return chatRooms;
        rooms.forEach(room => {
            if (!chatRooms.has(room.roomName)) {
                chatRooms.set(room.roomName, new ChatRoom(room, room.roomName));
            }
        });
        return chatRooms;
    }

    const clearUnreadRoom = (roomName: string) => {
        const name = !roomName ? chatRoomName : roomName;
        if (!unreadCounts[name]) {
            return;
        }
        unreadCountManager.clearRoomUnreads(name);
        updateUnreadCountManager(unreadCountManager);
        const newUnreads = unreadCountManager.getObject();
        setUnreadCounts(newUnreads);
    }

    const selectChatRoomName = (roomName: string) => {
        if (!chatRooms.has(roomName)) {
            chatRooms.set(roomName, new ChatRoom(
                !show.rooms ? null : show.rooms.find(room => room.roomName === roomName), roomName));
        }
        setChatRoomName(roomName);
        updateMessageList(roomName);
        updatePinList(roomName);
        clearUnreadRoom(roomName);
    }

    const updateMessageList = (roomName?: string) => {
        const update = (name) => {
            if (!chatRooms.has(name)) return;
            setMessages([...chatRooms.get(name).messages]);
        }
        if (!roomName) update(chatRoomName);
        else update(roomName);
    }

    const updatePinList = (roomName?: string) => {
        const update = (name) => {
            if (!chatRooms.has(name)) return;
            const pinArray = Array.from(chatRooms.get(name).pins)
                .map(rawPin => {return {msgIndex: rawPin[0], message: rawPin[1]}});
            const sortedPinArray = [...pinArray.sort((a,b) => a.msgIndex - b.msgIndex)];
            setPins(sortedPinArray);
        }
        if (!roomName) update(chatRoomName);
        else update(roomName);
    }

    if (socket != null) {
        socket.off(EVENTS.SERVER.ALL_PINNED_MESSAGES)
            .on(EVENTS.SERVER.ALL_PINNED_MESSAGES, (allPinsList, callback) => {
                if (allPinsList == null) return;
                allPinsList.forEach(roomData => {
                    const {chatName, pinList} = roomData;
                    // fix to add chatRoom when not found
                    if (!chatRooms.has(chatName) || !pinList) return;
                    const chatRoom = chatRooms.get(chatName);
                    pinList.forEach(pinData => {
                        chatRoom.pinMessage(pinData.msgIndex, pinData.message);
                    });
                    if (chatName === chatRoomName) updatePinList();
                })

                callback(user);
            });

        socket.off(EVENTS.SERVER.DELIVER_MESSAGE)
            .on(EVENTS.SERVER.DELIVER_MESSAGE, ({message, msgIndex}) => {
                // handled by emit's ack
                const isTheatre = show && show.rooms && show.rooms.find(room => room.roomName === message.sendTo);
                console.log('recv', message, 'with index', msgIndex);
                if (message.fromSocketId === socket.id) 
                    return;
                if (!chatRooms.has(message.sendTo))  {
                    chatRooms.set(message.sendTo, 
                        new ChatRoom(isTheatre, CHANNELS.MAIN_ROOM));
                }
                chatRooms.get(message.sendTo).addMessage(message, msgIndex);
                if (!unreadCountManager.hasRoom(message.sendTo)) {
                    unreadCountManager.addRoom(message.sendTo, isTheatre ? MODES.THEATRE : MODES.QNA);
                }
                unreadCountManager.incrementRoomUnread(message.sendTo);
                const newUnreads = unreadCountManager.getObject();
                setUnreadCounts(newUnreads);
                updateUnreadCountManager(unreadCountManager);
                // if this chat is the current displayed chat room, update the message displayed immediately.
                if (message.sendTo === chatRoomName) {
                    updateMessageList();
                }
                console.log('unreads', unreadCountManager.getObject(), message.sendTo);
            });
        
        socket.off(EVENTS.SERVER.PINNED_MESSAGE)
            .on(EVENTS.SERVER.PINNED_MESSAGE, ({message, msgIndex}) => {
                // handled by emit's ack
                if (!chatRooms.has(message.sendTo)) 
                    return;
                chatRooms.get(message.sendTo).pinMessage(msgIndex, message);
                if (message.sendTo === chatRoomName) {
                    updateMessageList();
                    updatePinList();
                }
            });
        
        socket.off(EVENTS.SERVER.UNPINNED_MESSAGE)
            .on(EVENTS.SERVER.UNPINNED_MESSAGE, ({message, msgIndex}) => {
                // handled by emit's ack
                if (!chatRooms.has(message.sendTo)) 
                    return;
                chatRooms.get(message.sendTo).unpinMessage(msgIndex, message);
                if (message.sendTo === chatRoomName) {
                    updateMessageList();
                    updatePinList();
                }
            });

        socket.off(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT)
            .on(EVENTS.SERVER.TOGGLE_AUDIENCE_CHAT, ({status}) => {
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
            updateMessageList,
            pins,
            updatePinList,
            unreadCounts,
            clearUnreadRoom,
        }} 
        {...props}
    />;
}

export const useChatRooms = () => useContext(ChatRoomContext);

export default ChatRoomProvider;