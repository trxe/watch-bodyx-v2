import { Server } from "socket.io";
import { Ack } from "../interfaces/ack";
import { CLIENT_EVENTS } from "../protocol/events";
import { ROOMS } from "../protocol/roomNames";
import Provider from "../provider"
import Logger from "../utils/logger";

const SHOW_EVENTS = {
    CURRENT_SHOW: 'CURRENT_SHOW',
    ACKS: {
        UPDATE_SUCCESS: new Ack('success', 'Show updated successfully'),
        INVALID_EVENT_ID: new Ack('error', 'Invalid Event Id')
    }
}

export const sendShow = (socket) => {
    socket.emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShowJSON(), 
        (res) => {
            Logger.info(res);
        });
}

export const sendShowToRoom = (io: Server, roomName: string) => {
    io.to(roomName).emit(SHOW_EVENTS.CURRENT_SHOW, Provider.getShowJSON(), 
        (res) => {
            Logger.info(res);
        });
}

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

    // TODO:
    const createRoom = () => {

    }

    // TODO:
    const updateRoom = () => {

    }

    // TODO:
    const deleteRoom = () => {

    }

    // TODO:
    const joinRoom = () => {

    }

    // TODO:
    const startShow = () => {

    }

    socket.on(CLIENT_EVENTS.UPDATE_SHOW, updateShow);
}