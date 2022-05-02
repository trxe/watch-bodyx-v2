import { Server } from "socket.io"
import { Message } from "../interfaces/message"
import { CLIENT_EVENTS } from "../protocol/events"
import Logger from "../utils/logger"

const CHAT_EVENTS = {
    DELIVER_MESSAGE: 'DELIVER_MESSAGE',
    PINNED_MESSAGE: 'PINNED_MESSAGE',
    ROOM_PINNED_MESSAGES: 'ROOM_PINNED_MESSAGES',
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

export const registerChatHandlers = (io, socket) => {
    // Receive a message to be sent to a list of rooms/sockets 
    // e.g. all breakout rooms, SM_ROOM and one socket
    const recvMessage = (message: Message, callback) => {
        console.log(message);
        const recepients: Array<string> = message.sendTo;
        recepients.forEach(recepient => {
            sendMessage(io, recepient, message);
        });
        callback({status: 'delivered'});
    }

    // Receive a message to be pinned/saved to a list, present for each room
    const recvPin = () => {

    }

    socket.on(CLIENT_EVENTS.NEW_MESSAGE, recvMessage);
}