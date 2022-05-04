import { Server } from "socket.io"
import { Message } from "../interfaces/message"
import { CHANNELS } from "../protocol/channels"
import { CLIENT_EVENTS } from "../protocol/events"
import Provider from "../provider"
import Logger from "../utils/logger"

const CHAT_EVENTS = {
    DELIVER_MESSAGE: 'DELIVER_MESSAGE',
    PINNED_MESSAGE: 'PINNED_MESSAGE',
    ROOM_PINNED_MESSAGES: 'ROOM_PINNED_MESSAGES',
    TOGGLE_AUDIENCE_CHAT: 'TOGGLE_AUDIENCE_CHAT'
}

// Send a message to a list of rooms/sockets 
export const sendMessage = (io: Server, recepient: string, message: Message) => {
    Logger.info(`Sending message to ${recepient}`);
    io.to(recepient).emit(CHAT_EVENTS.DELIVER_MESSAGE, message);
}

// Pin a message in a room
export const informPin = () => {}

// Send list of pinned messages to a room
export const sendPinnedMessages = () => {}

/**
 * Inform an audience member at socketId of current chat status
 * @param io 
 * @param socketId 
 * @param audienceChatStatus 
 */
export const informSocketChatStatus = (io: Server, socketId: string, audienceChatStatus: boolean) => {
    io.to(socketId).emit(CHAT_EVENTS.TOGGLE_AUDIENCE_CHAT, {status: audienceChatStatus});
}

// Inform all MAIN_ROOM audience the chat is disabled.
export const informAudienceChatStatus = (io: Server, audienceChatStatus: boolean) => {
    io.to(CHANNELS.MAIN_ROOM).emit(CHAT_EVENTS.TOGGLE_AUDIENCE_CHAT, {status: audienceChatStatus});
}

export const registerChatHandlers = (io, socket) => {
    // Receive a message to be sent to a list of rooms/sockets 
    // e.g. all breakout rooms, SM_ROOM and one socket
    const recvMessage = (message: Message, callback) => {
        // TODO: Fix the missing admins
        const recepients: Array<string> = message.sendTo;
        recepients.forEach(recepient => {
            sendMessage(io, recepient, message);
        });
        callback({status: 'delivered'});
    }

    // Receive a message to be pinned/saved to a list, present for each room
    const recvPin = (message: Message, callback) => {
    }

    // toggle chat settings
    const adminToggleAudienceChat = ({status}, callback) => {
        const audienceChatStatus = Provider.getChatManager().toggleAudienceChat(!status);
        informAudienceChatStatus(io, audienceChatStatus);
        callback({status: audienceChatStatus});
    }

    socket.on(CLIENT_EVENTS.NEW_MESSAGE, recvMessage);
    socket.on(CLIENT_EVENTS.ADMIN_TOGGLE_AUDIENCE_CHAT, adminToggleAudienceChat);
}