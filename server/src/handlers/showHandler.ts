import { Server } from "socket.io";
import { Ack } from "../interfaces/ack";
import { Client } from "../interfaces/client";
import { User } from "../interfaces/users";
import { CLIENT_EVENTS } from "../protocol/events";
import { ROOMS } from "../protocol/roomNames";
import Provider from "../provider"
import socket from "../server";
import Logger from "../utils/logger";

const SHOW_EVENTS = {
    CURRENT_SHOW: 'CURRENT_SHOW',
    CURRENT_ROOMS: 'CURRENT_ROOMS',
    CURRENT_CLIENTS: 'CURRENT_CLIENTS',
    ADD_CLIENT: 'ADD_CLIENT',
    DISCONNECTED_CLIENT: 'DISCONNECTED_CLIENT',
    FORCE_JOIN_CHANNEL: 'FORCE_JOIN_CHANNEL',
    ACKS: {
        UPDATE_SUCCESS: new Ack('success', 'Show updated successfully'),
        INVALID_EVENT_ID: new Ack('error', 'Invalid Event Id'),
        MISSING_FIELD: new Ack('error', 'Missing field'),
        JOIN_SUCCESS: new Ack('success', 'Joined room successfully'),
    }
}

/**
 * Logs an acknowledgement from a client socket.
 * @param socketId 
 * @param info 
 */
const logSocketIdEvent = (socketId: string, info: string) => {
    const user: User = Provider.getClientBySocket(socketId).user;
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
            logSocketIdEvent(socketId, 'has received user list');
        }
    );
}

/**
 * Sends the client's information to the admin.
 * @param io 
 * @param client 
 */
export const sendClientToAdmin = (io, client: Client) => {
    io.to(ROOMS.SM_ROOM).emit(SHOW_EVENTS.ADD_CLIENT, client);
}

/**
 * Sends the ticket id of the disconnected client to the admin
 * @param io 
 * @param ticket of the disconnected client
 */
export const sendClientDisconnectedToAdmin = (io, ticket: string) => {
    io.to(ROOMS.SM_ROOM).emit(SHOW_EVENTS.DISCONNECTED_CLIENT, ticket);
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
 * @param channelName 
 */
export const clientForceJoinChannel = (socket, channelName: string) => {
    // TODO: add callback AND FIX UP FORCE JOIN on client side.
    socket.emit(SHOW_EVENTS.FORCE_JOIN_CHANNEL, channelName, 
        (socketId)=>{
            logSocketIdEvent(socketId, 'joined room' + channelName);
        }
    );
}

/**
 * Send a command to all clients in a room to change channels.
 * @param io 
 * @param origChannel The channel to move all clients from
 * @param channelName Channel to move all clients to
 */
export const clientsForceJoinChannel = (io: Server, origChannel: string, channelName: string) => {
    io.to(origChannel).emit(SHOW_EVENTS.FORCE_JOIN_CHANNEL, channelName);
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
                sendShowToRoom(io, ROOMS.MAIN_ROOM);
                callback(SHOW_EVENTS.ACKS.UPDATE_SUCCESS.getJSON());
            },
            () => { 
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
            (id) => {
                callback(new Ack('info', name, id).getJSON())
                const show = Provider.getShow();
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS,  show.getJSON().rooms, 
                    (socketId) => {
                        logSocketIdEvent(socketId, 'has received rooms')
                    }
                );
            }, 
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            });

    }

    // ADMIN-only: updates a room
    const updateRoom = (room, callback) => {
        Provider.updateRoom(room, 
            (id) => {
                callback(new Ack('info', room, id).getJSON())
                const show = Provider.getShow();
                io.to(ROOMS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms);
            }, 
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            }
        );
    }

    // ADMIN-only: deletes a room
    const deleteRoom = (_id, callback) => {
        Provider.deleteRoom(_id,
            (id) => {
                callback(new Ack('info', 'Deleted room', id).getJSON());
                const show = Provider.getShow();
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON(), 
                    socketId => {logSocketIdEvent(socketId, 'has deleted room')}
                );
                io.to(ROOMS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, show.getJSON().rooms);
            }, 
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
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
                socket.leave(oldRoomName);
                socket.join(client.roomName);
                sendClientToAdmin(io, client);
                callback(SHOW_EVENTS.ACKS.JOIN_SUCCESS.getJSON());
            },
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            });
    }

    // Assigns a user to a socket channel.
    const joinChannel = (newChannel, callback) => {
        Provider.setClientChannel(socket.id, newChannel, 
            (client, oldChannel) => {
                socket.leave(oldChannel);
                socket.join(client.roomName);
                Logger.info(`${client.user.name} has joined ${client.roomName}.`);
                sendClientToAdmin(io, client);
                callback(SHOW_EVENTS.ACKS.JOIN_SUCCESS.getJSON());
            },
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            });
    }

    socket.on(CLIENT_EVENTS.UPDATE_SHOW, updateShow);
    socket.on(CLIENT_EVENTS.CREATE_ROOM, createRoom);
    socket.on(CLIENT_EVENTS.UPDATE_ROOM, updateRoom);
    socket.on(CLIENT_EVENTS.DELETE_ROOM, deleteRoom);
    socket.on(CLIENT_EVENTS.JOIN_ROOM, joinRoom);
    socket.on(CLIENT_EVENTS.JOIN_CHANNEL, joinChannel);
    socket.on(CLIENT_EVENTS.TOGGLE_SHOW_START, toggleShowStart);
}