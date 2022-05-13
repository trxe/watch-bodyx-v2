import { Server } from "socket.io";
import { Ack } from "../interfaces/ack";
import { Client } from "../interfaces/client";
import { User } from "../interfaces/users";
import { CLIENT_EVENTS } from "../protocol/events";
import { CHANNELS } from "../protocol/channels";
import Provider from "../provider"
import Logger from "../utils/logger";
import { Room } from "../interfaces/room";
import { sendPinnedMessagesToSocket } from "./chatHandler";

const SHOW_EVENTS = {
    CURRENT_SHOW: 'CURRENT_SHOW',
    CURRENT_ROOMS: 'CURRENT_ROOMS',
    CURRENT_CLIENTS: 'CURRENT_CLIENTS',
    ADD_CLIENT: 'ADD_CLIENT',
    DISCONNECTED_CLIENT: 'DISCONNECTED_CLIENT',
    FORCE_JOIN_CHANNEL: 'FORCE_JOIN_CHANNEL',
    FORCE_JOIN_ROOM: 'FORCE_JOIN_ROOM',
    FORCE_DISCONNECT: 'FORCE_DISCONNECT',
    ACKS: {
        UPDATE_SUCCESS: new Ack('success', 'Show updated successfully'),
        INVALID_EVENT_ID: new Ack('error', 'Invalid Event Id'),
        MISSING_FIELD: new Ack('error', 'Missing field'),
        JOIN_SUCCESS: new Ack('success', 'Joined room successfully'),
        UNKNOWN_ERROR: new Ack('error', 'Unknown ERROR'),
    }
}

/**
 * Logs an acknowledgement from a client socket.
 * @param socketId 
 * @param info 
 */
const logSocketIdEvent = (socketId: string, info: string) => {
    const client: Client = Provider.getClientBySocket(socketId);
    if (!client) {
        Logger.warn(`Client with socket id ${socketId} not found.`);
        return;
    }
    const user: User = client.user;
    Logger.info(`${user.isAdmin ? 'Admin' : 'Viewer'} ${user.name} ${info}.`);
}

/**
 * Sends show to socket.
 * @param socket 
 */
export const sendShow = (socket) => {
    socket.emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShow().getJSON(), 
        (socketId) => {
            logSocketIdEvent(socketId, 'has received show');
        });
}

/**
 * Sends the list of clients to the socket.
 * @param socket 
 */
export const sendClients = (socket) => {
    socket.emit(SHOW_EVENTS.CURRENT_CLIENTS, Provider.getClientListJSON(),
        (socketId) => {
            logSocketIdEvent(socketId, 'has received client list');
        }
    );
}

/**
 * Sends the client's information to the admin.
 * @param io 
 * @param client 
 */
export const sendClientToAdmin = (io, client: Client) => {
    io.to(CHANNELS.SM_ROOM).emit(SHOW_EVENTS.ADD_CLIENT, client);
    Logger.info(`Admins are sent new client.`);
}

/**
 * Sends the ticket id of the disconnected client to the admin
 * @param io 
 * @param ticket of the disconnected client
 */
export const sendClientDisconnectedToAdmin = (io, ticket: string, socketId: string) => {
    io.to(CHANNELS.SM_ROOM).emit(SHOW_EVENTS.DISCONNECTED_CLIENT, {ticket, socketId});
    Logger.info(`Admins are informed of disconnected client.`);
}

/**
 * Sends show to given room.
 * @param io 
 * @param roomName 
 */
export const sendShowToRoom = (io: Server, roomName: string) => {
    io.to(roomName).emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShow().getJSON());
}

/**
 * Send a command to client to join another channel.
 * @param socket 
 * @param msg Reason for kick/ban
 */
export const clientForceDisconnect = (io: Server, socketId: string, msg: string) => {
    io.to(socketId).emit(SHOW_EVENTS.FORCE_DISCONNECT, {msg});
}

/**
 * Send a command to client to join another channel.
 * @param socket 
 * @param channelName 
 */
export const clientForceJoinChannel = (io: Server, socketId: string, channelName: string) => {
    io.to(socketId).emit(SHOW_EVENTS.FORCE_JOIN_CHANNEL, channelName);
}

/**
 * Send a command to client to join another room.
 * @param socket 
 * @param roomName 
 */
export const clientForceJoinRoom = (io: Server, socketId: string, roomName: string) => {
    io.to(socketId).emit(SHOW_EVENTS.FORCE_JOIN_ROOM, roomName);
}

/**
 * Send a command to all clients in a channel to change channels.
 * @param io 
 * @param origChannel The channel to move all clients from
 * @param channelName Channel to move all clients to
 * @param roomName Optional room name to move all clients from or to DEFAULT_ROOM
 */
export const clientsForceJoinChannel = (io: Server, origChannel: string, channelName: string) => {
    io.to(origChannel).emit(SHOW_EVENTS.FORCE_JOIN_CHANNEL, channelName);
}

/**
 * Send a command to all clients in a room to change room.
 * @param io 
 * @param origRoom 
 * @param roomName 
 */
export const clientsForceJoinRoom = (io: Server, origRoom: string, roomName: string) => {
    io.to(origRoom).emit(SHOW_EVENTS.FORCE_JOIN_ROOM, roomName);
}

const addSMsToRoom = async (io: Server, roomName: string) => {
    const smList = await io.in(CHANNELS.SM_ROOM).fetchSockets();
    smList.forEach(sm => { sm.join(roomName); });
}

const removeSMsFromRoom = async (io: Server, roomName: string) => {
    const smList = await io.in(CHANNELS.SM_ROOM).fetchSockets();
    smList.forEach(sm => { sm.leave(roomName); });
}

/**
 * Registers show handlers: 
 *  - updateShow
 *  - createRoom, updateRoom, deleteRoom
 *  - joinRoom
 * @param io 
 * @param socket 
 */
export const registerShowHandlers = (io: Server, socket) => {
    // ADMIN-only: updates a show's name and/or eventId
    const updateShow = ({name, eventId}, callback) => {
        name = !name ? '' : name.trim();
        eventId = !eventId ? '' : eventId.trim();
        Provider.setShowInfo(name, eventId, 
            () => { 
                sendShow(socket); 
                sendShowToRoom(io, CHANNELS.MAIN_ROOM);
                callback(SHOW_EVENTS.ACKS.UPDATE_SUCCESS.getJSON());
            },
            (error) => { 
                console.log('showHandler.ts', error)
                sendShow(socket); 
                callback(SHOW_EVENTS.ACKS.INVALID_EVENT_ID.getJSON());
            }
        )
    }

    // ADMIN-only: creates a room
    const createRoom = ({name, url, isLocked}, callback) => {
        if (!name || name === '' || !url) {
            callback({...SHOW_EVENTS.ACKS.MISSING_FIELD.getJSON(), 
                message: 'Missing room name or URL.'})
        }
        Provider.createRoom(name, url, isLocked, 
            (room: Room) => {
                callback(new Ack('info', 'Room created', JSON.stringify(room)).getJSON())
                const show = Provider.getShow();
                io.to(CHANNELS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms);
                addSMsToRoom(io, room.roomName);
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS,  show.getJSON().rooms, 
                    (socketId) => {
                        logSocketIdEvent(socketId, 'has received rooms')
                    }
                );
            }, 
            (err) => {
                Logger.error(err);
                callback(SHOW_EVENTS.ACKS.UNKNOWN_ERROR.getJSON())
            });

    }

    // ADMIN-only: updates a room
    const updateRoom = (room, callback) => {
        Provider.updateRoom(room, 
            (id: string) => {
                callback(new Ack('info', room, id).getJSON())
                const show = Provider.getShow();
                io.to(CHANNELS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms);
            }, 
            (err) => {
                Logger.error(err);
                callback(SHOW_EVENTS.ACKS.UNKNOWN_ERROR.getJSON())
            }
        );
    }

    // ADMIN-only: deletes a room
    const deleteRoom = (_id, callback) => {
        Provider.deleteRoom(_id,
            (room) => {
                // TODO: Kick users from this room
                // io.to(_id + '_ROOM').emit(SHOW_EVENTS.FORCE_JOIN_ROOM, Provider.getShowMainRoom());
                console.log(room);
                callback(new Ack('info', 'Deleted room', room._id).getJSON());
                const show = Provider.getShow();
                removeSMsFromRoom(io, room.roomName);
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms, 
                    socketId => {logSocketIdEvent(socketId, 'has deleted room')}
                );
                io.to(CHANNELS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms);
            }, 
            (err) => {
                Logger.error(err);
                callback(SHOW_EVENTS.ACKS.UNKNOWN_ERROR.getJSON())
            }
        );
    }

    // Admin only: Move clients from channel to channel when show starts
    const toggleShowStart = ({fromChannel, toChannel, isShowOpen}, callback) => {
        clientsForceJoinChannel(io, fromChannel, toChannel);
        Provider.getShow().setShowOpen(isShowOpen);
        Logger.info(`Changing House open status to: ${isShowOpen ? 'open' : 'closed'}`);
        sendShow(socket);
        callback(new Ack('success', `House ${isShowOpen ? 'opened' : 'closed'} successfully`).getJSON());
    }

    // Assigns a user to a room via room ID.
    const joinRoom = (roomId, callback) => {
        Provider.setClientRoom(socket.id, roomId, 
            (client, oldRoomName) => {
                if (oldRoomName != null) socket.leave(oldRoomName);
                socket.join(client.roomName);
                Logger.info(`${client.user.name} has joined room ${client.roomName}.`);
                sendClientToAdmin(io, client);
                callback(SHOW_EVENTS.ACKS.JOIN_SUCCESS.getJSON());
            },
            (err) => {
                Logger.error(err);
                callback(SHOW_EVENTS.ACKS.UNKNOWN_ERROR.getJSON())
            });
    }

    // Assigns a user to a socket channel.
    const joinChannel = (newChannel, callback) => {
        Provider.setClientChannel(socket.id, newChannel, 
            (client, oldChannel) => {
                if (oldChannel != null) socket.leave(oldChannel);
                socket.join(client.channelName);
                Logger.info(`${client.user.name} has joined channel ${client.channelName}.`);
                sendClientToAdmin(io, client);
                callback(SHOW_EVENTS.ACKS.JOIN_SUCCESS.getJSON());
            },
            (err) => {
                Logger.error(err);
                callback(SHOW_EVENTS.ACKS.UNKNOWN_ERROR.getJSON())
            });
    }

    // Admin-only: Move socket to this room/channel
    const moveSocketTo = ({socketId, newChannel, newRoom, reason}, callback) => {
        const client = Provider.getClientBySocket(socketId);
        if (client == null) {
            callback(new Ack('error', `User with socketId ${socketId} not found`));
            return;
        }
        // For kicking clients
        if (newChannel === CHANNELS.DISCONNECTED)  {
            clientForceDisconnect(io, socketId, reason);
            callback(new Ack('success', `Disconnecting ${client.user.name}`));
        } else if (newChannel != null) {
            clientForceJoinChannel(io, socketId, newChannel);
            callback(new Ack('success', `Moving ${client.user.name} to channel ${newChannel}`).getJSON());
        }
        if (newRoom != null) {
            clientForceJoinRoom(io, socketId, newRoom);
            callback(new Ack('success', `Moving ${client.user.name} to room ${newRoom}`).getJSON());
        }
        Logger.info(`Moving ${client.user.name} to channel ${newChannel}, room ${newRoom}`);
    }

    // Get particular info
    const getInfo = ({request}) => {
        console.log(`received request for ${request}`)
        if (request === 'clients') {
            sendClients(socket);
        } else if (request === 'all_pins') {
            sendPinnedMessagesToSocket(socket);
        }
    }

    socket.on(CLIENT_EVENTS.UPDATE_SHOW, updateShow);
    socket.on(CLIENT_EVENTS.CREATE_ROOM, createRoom);
    socket.on(CLIENT_EVENTS.UPDATE_ROOM, updateRoom);
    socket.on(CLIENT_EVENTS.DELETE_ROOM, deleteRoom);
    socket.on(CLIENT_EVENTS.JOIN_ROOM, joinRoom);
    socket.on(CLIENT_EVENTS.JOIN_CHANNEL, joinChannel);
    socket.on(CLIENT_EVENTS.TOGGLE_SHOW_START, toggleShowStart);
    socket.on(CLIENT_EVENTS.MOVE_SOCKET_TO, moveSocketTo);
    socket.once(CLIENT_EVENTS.GET_INFO, getInfo);
}