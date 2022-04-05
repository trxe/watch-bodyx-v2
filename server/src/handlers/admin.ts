import axios from "axios";
import { EVENTS } from "../protocol/events";
import Logger from "../utils/logger";
import * as dotenv from 'dotenv';
import { ROOM_HOUSE } from "../server";
import { IAttendee, IShow, ShowModel } from "../schemas/showSchema";
import { STATUS } from "../utils/ack";
import { socketRoomIndex } from "./viewer";

export const createNewRoom = (room, socket, show) => {
    show.rooms.push(room);
    socket.to(ROOM_HOUSE).emit(EVENTS.SERVER.CURRENT_SHOW, show);
    socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
}

export const updateRoomList = ({index, room}, socket, user, show) => {
    // must kick everyone into the main room.
    if (!verifyAdmin(user, socket)) return;
    const roomId: string = show.rooms[index]._id.toString();
    const mustKick = !show.rooms[index].isLocked && room.isLocked;
    const roomOpened = show.rooms[index].isLocked  && !room.isLocked;
    show.rooms[index] = {...room, _id: roomId };
    const socketRoomName = socketRoomIndex(roomId);
    if (mustKick) {
        socket.to(socketRoomName)
            .emit(EVENTS.SERVER.FORCE_JOIN, {index: 0})
        Logger.info(`${socketRoomName} closed`);
    } else if (roomOpened) {
        Logger.info(`${socketRoomName} open`);
    }
    socket.to(ROOM_HOUSE).emit(EVENTS.SERVER.CURRENT_SHOW, show);
    socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
}