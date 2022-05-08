import { ObjectID } from "bson"
import { Server } from "socket.io"
import { Ack } from "../interfaces/ack"
import { Message } from "../interfaces/message"
import { CHANNELS } from "../protocol/channels"
import { CLIENT_EVENTS } from "../protocol/events"
import Provider from "../provider"
import Logger from "../utils/logger"

const CHAT_EVENTS = {
    DELIVER_MESSAGE: 'DELIVER_MESSAGE',
    PINNED_MESSAGE: 'PINNED_MESSAGE',
    UNPINNED_MESSAGE: 'UNPINNED_MESSAGE',
    ALL_PINNED_MESSAGES: 'ALL_PINNED_MESSAGES',
    TOGGLE_AUDIENCE_CHAT: 'TOGGLE_AUDIENCE_CHAT'
}

/**
 * Send a message to all recepients, 
 * which update their message log based on the sendTo field in message.
 * @param io 
 * @param recepient 
 * @param data message and msgIndex
 */
export const sendMessage = (io: Server, recepient: string, 
    data: {message: Message, msgIndex: number}) => {
        Logger.info(`Sending message to ${recepient}`);
        io.to(recepient).emit(CHAT_EVENTS.DELIVER_MESSAGE, data);
}

/**
 * Pin a message in a room for all recepients, 
 * which update their message log based on the sendTo field in message.
 * @param io 
 * @param recepient 
 * @param data message and msgIndex
 */
export const pinMessage = (io: Server, recepient: string, 
    data: {message: Message, msgIndex: number}) => {
        Logger.info(`Pinning message to ${recepient}`);
        io.to(recepient).emit(CHAT_EVENTS.PINNED_MESSAGE, data);
}

// 
/**
 * Unpin a message in a room for all recepients, 
 * which update their message log based on the sendTo field in message.
 * @param io 
 * @param recepient 
 * @param data message and msgIndex
 */
export const unpinMessage = (io: Server, recepient: string, 
    data: {message: Message, msgIndex: number}) => {
        Logger.info(`Unpinning message from ${recepient}`);
        io.to(recepient).emit(CHAT_EVENTS.UNPINNED_MESSAGE, data);
}

/**
 * Send entire list of pinned messages to socket, in format
 * Array<{chatName: string, pinList: Array<msgIndex: number, message: Message>}>
 * @param socket 
 */
export const sendPinnedMessagesToSocket = (socket) => {
    const allPinsList = Provider.getChatManager().getPinList();
    socket.emit(CHAT_EVENTS.ALL_PINNED_MESSAGES, allPinsList, (user) => {
        Logger.info(`Sent pinned messages to ${!user ? socket.id : user.name}`);
    });
}

/**
 * Inform an audience member at socketId of current chat status
 * @param socket
 * @param audienceChatStatus 
 */
export const informSocketChatStatus = (socket, audienceChatStatus: boolean) => {
    socket.emit(CHAT_EVENTS.TOGGLE_AUDIENCE_CHAT, {status: audienceChatStatus});
}

/**
 * Inform all MAIN_ROOM audience the chat is disabled.
 * @param io 
 * @param audienceChatStatus 
 */
export const informAudienceChatStatus = (io: Server, audienceChatStatus: boolean) => {
    io.to(CHANNELS.MAIN_ROOM).emit(CHAT_EVENTS.TOGGLE_AUDIENCE_CHAT, {status: audienceChatStatus});
}

export const registerChatHandlers = (io, socket) => {
    // Receive a message to be sent to a list of rooms/sockets 
    // e.g. all breakout rooms, SM_ROOM and one socket
    const recvMessage = (message: Message, callback) => {
        message._id = new ObjectID().toString();
        const recepient = message.sendTo;
        const chatManager = Provider.getChatManager();
        if (!chatManager.hasRoom(recepient)) {
            if (message.isPrivate) {
                const client = Provider.getClientBySocket(socket.id);
                if (client != null) chatManager.createPrivateChat(client);
                else {
                    callback(new Ack('error', 'Message failed to send, refresh to reconnect').getJSON());
                    return;
                }
            } else {
                const room = Provider.getShow().rooms.find(r => r.roomName === recepient);
                if (room != null) chatManager.createPublicChat(room);
                else {
                    callback(new Ack('error', 'Message failed to send.', 'Please wait for administrator reset the rooms.').getJSON());
                    return;
                }
            }
        }

        const msgIndex = Provider.getChatManager().addMessageToRoom(recepient, message);
        // NOTE: The line below is if 
        // sendMessage(io, recepient, {message, msgIndex});
        sendMessage(io, CHANNELS.MAIN_ROOM, {message, msgIndex});
        sendMessage(io, CHANNELS.SM_ROOM, {message, msgIndex});
        callback(new Ack('info', 'Message with id', JSON.stringify({message, msgIndex})));
    }

    // Receive a message to be pinned/saved to a list, present for each room
    const recvPin = ({msgIndex, chatName}, callback) => {
        // add pin to list
        // console.log(msgIndex, chatName);
        const chatManager = Provider.getChatManager();
        if (!chatManager.hasRoom(chatName)) {
            callback(new Ack('error', 'Chat not found', 'Room may have been deleted.').getJSON());
            return;
        }
        const message: Message = chatManager.pinMessageInRoom(chatName, msgIndex);
        pinMessage(io, CHANNELS.MAIN_ROOM, {message, msgIndex});
        pinMessage(io, CHANNELS.SM_ROOM, {message, msgIndex});
        callback(new Ack('info', 'Pin with id', JSON.stringify({message, msgIndex})));
    }

    // Unpin this message (given msgIndex) from this chat
    const recvUnpin = ({msgIndex, chatName}, callback) => {
        console.log(msgIndex, chatName);
        const chatManager = Provider.getChatManager();
        if (!chatManager.hasRoom(chatName)) {
            callback(new Ack('error', 'Chat not found', 'Room may have been deleted.').getJSON());
            return;
        }
        const message: Message = chatManager.unpinMessageInRoom(chatName, msgIndex);
        unpinMessage(io, CHANNELS.MAIN_ROOM, {message, msgIndex});
        unpinMessage(io, CHANNELS.SM_ROOM, {message, msgIndex});
        callback(new Ack('info', 'Unpin with id', JSON.stringify({message, msgIndex})));
    }

    // Toggle chat availability
    const adminToggleAudienceChat = ({status}, callback) => {
        const audienceChatStatus = Provider.getChatManager().toggleAudienceChat(!status);
        informAudienceChatStatus(io, audienceChatStatus);
        callback({status: audienceChatStatus});
    }

    socket.on(CLIENT_EVENTS.NEW_MESSAGE, recvMessage);
    socket.on(CLIENT_EVENTS.PIN_MESSAGE, recvPin);
    socket.on(CLIENT_EVENTS.UNPIN_MESSAGE, recvUnpin);
    socket.on(CLIENT_EVENTS.ADMIN_TOGGLE_AUDIENCE_CHAT, adminToggleAudienceChat);
}