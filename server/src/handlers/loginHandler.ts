import { CHANNELS } from "../protocol/channels"
import { Ack } from "../interfaces/ack"
import { Client } from "../interfaces/client"
import Provider from "../provider"
import Logger from "../utils/logger"
import { CLIENT_EVENTS } from "../protocol/events"
import { sendClientDisconnectedToAdmin, sendClients, sendClientToAdmin, sendShow } from "./showHandler"
import { informSocketChatStatus } from "./chatHandler"

const LOGIN_EVENTS = {
    CLIENT_INFO: "CLIENT_INFO",
    RECONNECTION: "RECONNECTION",
    ACKS: {
        INVALID_LOGIN: new Ack('error', 'User not found', 'Invalid email/ticket.'),
        MULTIPLE_LOGIN: new Ack('warning', 'You are logged in on multiple instances', 
            'Other instances will be disconnected. Please login again.'),
        VALID_LOGIN: new Ack('success', 'User found', ''),
        UNKNOWN_ERROR: new Ack('error', 'Unknown error', '')
    }
}

export const registerLoginHandlers = (io, socket) => {
    const recvLogin = ({ticket, email}, callback) => {
        let channelName = CHANNELS.WAITING_ROOM;
        let showEventId = Provider.getShow().eventId;
        Provider.logInOutUser({ticket, email}, true)
            .then(user => {
                if (!user) {
                    callback(LOGIN_EVENTS.ACKS.INVALID_LOGIN.getJSON());
                    return;
                }
                if (user.isAdmin) {
                    channelName = CHANNELS.SM_ROOM;
                    // admins have to receive all messages and are thus in every room
                    Provider.getShow().rooms.forEach(room => socket.join(room.roomName));
                } else if (!user.eventIds.find(id => id === showEventId)) {
                    channelName = CHANNELS.NON_ATTENDEES_ROOM;
                    // attendees of other events join their respective rooms 
                    // by eventId to be called in when their event commences.
                    socket.join(showEventId);
                }
                const client = {user, socketId: socket.id, channelName}
                Provider.setClient(socket.id, ticket, client);
                socket.join(channelName);
                callback(new Ack('info', 'Client information', JSON.stringify(client)).getJSON());
            })
            .catch((err) => {
                Logger.error(err);
                callback(new Ack('error', err).getJSON());
            })
    }

    const replaceClient = ({oldSocketId, ticket, email}, callback) => {
        let channelName = CHANNELS.WAITING_ROOM;
        Provider.findUser({ticket, email})
            .then(user => {
                if (!user) {
                    callback(LOGIN_EVENTS.ACKS.INVALID_LOGIN.getJSON());
                    return;
                }
                let client: Client = Provider.getClientByTicket(ticket);
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (client.user.ticket != ticket || client.socketId !== oldSocketId || !oldSocket) {
                    callback(LOGIN_EVENTS.ACKS.INVALID_LOGIN.getJSON());
                    socket.disconnect();
                    return;
                }
                Provider.removeClientBySocketId(oldSocketId);
                oldSocket.disconnect();
                Logger.warn(`Reconnecting user ${user.firstName} from socket ${oldSocketId} to ${socket.id}.`)
                if (user.isAdmin) {
                    channelName = CHANNELS.SM_ROOM;
                    // admins have to receive all messages
                    Provider.getShow().rooms.forEach(room => socket.join(room.roomName));
                }
                client = {user, socketId: socket.id, channelName}
                Provider.setClient(socket.id, ticket, client);
                socket.join(channelName);
                callback(new Ack('info', 'Client information', JSON.stringify(client)).getJSON());
            })
            .catch((err) => {
                Logger.error(err);
                callback(LOGIN_EVENTS.ACKS.UNKNOWN_ERROR.getJSON());
            })
    }

    const adminInfo = (client, callback) => {
        sendShow(socket);
        informSocketChatStatus(socket, Provider.getChatManager().isAudienceChatEnabled); sendClients(socket);
        sendClientToAdmin(io, client);
        callback(new Ack('success', 'Loaded show info successfully').getJSON());
    }

    const viewerInfo = (client, callback) => {
        sendShow(socket);
        informSocketChatStatus(socket, Provider.getChatManager().isAudienceChatEnabled); sendClients(socket);
        sendClientToAdmin(io, client);
        callback(new Ack('success', 'Loaded show info successfully').getJSON());
    }

    const logout = () => {
        const ticket = Provider.removeClientBySocketId(socket.id);
        Provider.logInOutUser({ticket}, false)
            .then(user => {
                if (!user) return;
            });
        if (ticket != null) {
            sendClientDisconnectedToAdmin(io, ticket, socket.id);
            Logger.info(`Socket ${socket.id} with ticket ${ticket} disconnected`);
        } else {
            Logger.info(`Socket ${socket.id} disconnected`);
        }
    }

    socket.on(CLIENT_EVENTS.LOGIN, recvLogin);
    socket.on(CLIENT_EVENTS.REPLACE_CLIENT, replaceClient);
    socket.on(CLIENT_EVENTS.REQUEST_ADMIN_INFO, adminInfo);
    socket.on(CLIENT_EVENTS.REQUEST_VIEWER_INFO, viewerInfo);
    socket.on(CLIENT_EVENTS.LOGOUT, logout);
    socket.on(CLIENT_EVENTS.disconnect, logout);
}