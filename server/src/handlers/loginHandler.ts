import { CHANNELS } from "../protocol/channels"
import { Ack } from "../interfaces/ack"
import { Client } from "../interfaces/client"
import Provider from "../provider"
import Logger from "../utils/logger"
import { CLIENT_EVENTS } from "../protocol/events"
import { sendClientDisconnectedToAdmin, sendClients, sendClientToAdmin, sendShow } from "./showHandler"
import { informAudienceChatStatus, informSocketChatStatus } from "./chatHandler"

const LOGIN_EVENTS = {
    CLIENT_INFO: "CLIENT_INFO",
    ACKS: {
        INVALID_LOGIN: new Ack('error', 'User not found', 'Invalid email/ticket.'),
        VALID_LOGIN: new Ack('success', 'User found', ''),
        UNKNOWN_ERROR: new Ack('error', 'Unknown error', '')
    }
}


export const registerLoginHandlers = (io, socket) => {
    const recvLogin = ({socketId, ticket, email}, acknowledge) => {
        let channelName = CHANNELS.WAITING_ROOM;
        Provider.findUser({socketId, ticket, email})
            .then(user => {
                if (!user) {
                    acknowledge(LOGIN_EVENTS.ACKS.INVALID_LOGIN.getJSON());
                    return;
                }
                if (user.isAdmin) {
                    channelName = CHANNELS.SM_ROOM;
                    // admins have to receive all messages
                    Provider.getShow().rooms.forEach(room => socket.join(room.roomName));
                }
                const client: Client = {user, socketId, channelName}
                Provider.addClient(socketId, ticket, client);
                socket.emit(LOGIN_EVENTS.CLIENT_INFO, client);
                informSocketChatStatus(io, client.socketId, 
                    Provider.getChatManager().isAudienceChatEnabled);
                socket.join(channelName);
                sendShow(socket);
                if (user.isAdmin) {
                    sendClients(socket);
                } else {
                    sendClientToAdmin(io, client);
                }
                acknowledge(LOGIN_EVENTS.ACKS.VALID_LOGIN.getJSON());
            })
            .catch((err) => {
                Logger.error(err);
                acknowledge(LOGIN_EVENTS.ACKS.UNKNOWN_ERROR.getJSON());
            })
    }

    const logout = () => {
        const ticket = Provider.removeClientBySocketId(socket.id);
        if (ticket != null) {
            sendClientDisconnectedToAdmin(io, ticket);
            Logger.info(`User ${ticket} disconnected`);
        }
    }

    socket.on(CLIENT_EVENTS.LOGIN, recvLogin);
    socket.on(CLIENT_EVENTS.LOGOUT, logout);
    socket.on(CLIENT_EVENTS.disconnect, logout);
}