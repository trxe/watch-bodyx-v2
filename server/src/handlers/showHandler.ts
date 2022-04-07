import { Server } from "socket.io";
import { Ack } from "../interfaces/ack";
import { User } from "../interfaces/users";
import { CLIENT_EVENTS } from "../protocol/events";
import { ROOMS } from "../protocol/roomNames";
import Provider from "../provider"
import socket from "../server";
import Logger from "../utils/logger";

const SHOW_EVENTS = {
    CURRENT_SHOW: 'CURRENT_SHOW',
    CURRENT_ROOMS: 'CURRENT_ROOMS',
    ACKS: {
        UPDATE_SUCCESS: new Ack('success', 'Show updated successfully'),
        INVALID_EVENT_ID: new Ack('error', 'Invalid Event Id'),
        MISSING_FIELD: new Ack('error', 'Missing field'),
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
    socket.emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShowJSON(), 
        (socketId) => {
            logSocketIdEvent(socketId, 'has received show')
        });
}

/**
 * Sends show to given room.
 * @param io 
 * @param roomName 
 */
export const sendShowToRoom = (io: Server, roomName: string) => {
    io.to(roomName).emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShowJSON(), 
        (socketId) => {
            logSocketIdEvent(socketId, 'has received show')
        });
}

/**
 * Registers show handlers: 
 *  - updateShow
 *  - createRoom, updateRoom, deleteRoom
 * @param io 
 * @param socket 
 */
export const registerShowHandlers = (io: Server, socket) => {
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

    const createRoom = ({name, url, isLocked}, callback) => {
        if (!name || name === '' || !url) {
            callback({...SHOW_EVENTS.ACKS.MISSING_FIELD.getJSON(), 
                message: 'Missing room name or URL.'})
        }
        Provider.createRoom(name, url, isLocked, 
            (id) => {
                callback(new Ack('info', name, id).getJSON())
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS,  Provider.getRoomsJSON(), 
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

    // TODO:
    const updateRoom = (room, callback) => {
        Provider.updateRoom(room, 
            (id) => {
                callback(new Ack('info', room, id).getJSON())
                io.to(ROOMS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, Provider.getRoomsJSON());
            }, 
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            }
        );
    }

    // TODO:
    const deleteRoom = (_id, callback) => {
        Provider.deleteRoom(_id,
            (id) => {
                callback(new Ack('info', 'Deleted room', id).getJSON())
                socket.emit(SHOW_EVENTS.CURRENT_ROOMS, Provider.getRoomsJSON(), 
                    socketId => {logSocketIdEvent(socketId, 'has deleted room')}
                );
                io.to(ROOMS.MAIN_ROOM).emit(SHOW_EVENTS.CURRENT_ROOMS, Provider.getRoomsJSON());
            }, 
            (err) => {
                Logger.error(err);
                callback(new Ack('error', 'Unknown ERROR').getJSON())
            }
        );
    }

    // TODO:
    const joinRoom = () => {

    }

    // TODO:
    const startShow = () => {

    }

    socket.on(CLIENT_EVENTS.UPDATE_SHOW, updateShow);
    socket.on(CLIENT_EVENTS.CREATE_ROOM, createRoom);
    socket.on(CLIENT_EVENTS.UPDATE_ROOM, updateRoom);
    socket.on(CLIENT_EVENTS.DELETE_ROOM, deleteRoom);
}