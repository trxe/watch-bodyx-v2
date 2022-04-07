import { ROOMS } from "../protocol/roomNames"
import { Ack } from "../interfaces/ack"
import { Client } from "../interfaces/client"
import Provider from "../provider"
import Logger from "../utils/logger"
import { CLIENT_EVENTS } from "../protocol/events"
import { sendShow } from "./showHandler"

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
        let roomName = ROOMS.MAIN_ROOM;
        Provider.findUser({socketId, ticket, email})
            .then(user => {
                if (!user) {
                    acknowledge(LOGIN_EVENTS.ACKS.INVALID_LOGIN.getJSON());
                    return;
                }
                if (user.isAdmin) roomName = ROOMS.SM_ROOM;
                const client: Client = {user, socketId, roomName}
                Provider.addClient(socketId, ticket, client);
                socket.emit(LOGIN_EVENTS.CLIENT_INFO, client);
                sendShow(socket);
                socket.join(roomName);
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
            Logger.info(`User ${ticket} disconnected`);
        }
    }

    socket.on(CLIENT_EVENTS.LOGIN, recvLogin);
    socket.on(CLIENT_EVENTS.LOGOUT, logout);
    socket.on(CLIENT_EVENTS.disconnect, logout);
}