import axios from "axios";
import { EVENTS } from "./utils/events";
import Logger from "./utils/logger";
import * as dotenv from 'dotenv';
import { ROOM_HOUSE } from "./socket";
import { ShowModel } from "./schemas/Show";
import { STATUS } from "./utils/ack";
import { socketRoomIndex } from "./viewer";

dotenv.config();

export const verifyAdmin = (user, socket) => {
    if (!user) {
        socket.emit(EVENTS.SERVER.GENERIC_ERROR, STATUS.SESSION_EXP)
        return false;
    } else if (!user.isAdmin) {
        socket.emit(EVENTS.SERVER.GENERIC_ERROR, STATUS.INSUFFICIENT_PRIVILEGE)
        return false;
    }
    return true;
}

export async function getAttendees(eventId) {
    if (!eventId) return;
    eventId = eventId.trim();
    if (eventId.length == 0) return;
    let attendees = await axios.get(`https://www.eventbriteapi.com/v3/events/${eventId}/attendees`, 
        {headers: {
            'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
            'Content-Type': 'application/json',
        }}
    ).then((res) => {
        Logger.info(`Attendees from new eventid ${eventId}.`);
        return res.data.attendees.map(attendee => { return {
            profile: attendee.profile,
            ticket: attendee.order_id, }
        });
    }).catch((err) => {
        Logger.error(err);
    })
    return attendees;
}

async function saveShow(show) {
    const showToUpdate = await ShowModel.findOne();
    showToUpdate.name = show.name;
    showToUpdate.eventId = show.eventId;
    showToUpdate.rooms = [...show.rooms];
    await showToUpdate.save();
}

// To place all admin callbacks later.
export const updateShowEvent = ({name, eventId, rooms}, socket, show, attendees) => {
    name = !name ? '' : name.trim();
    eventId = !eventId ? '' : eventId.trim();
    // const isEventIdDiff = eventId != show.eventId;
    show.name = name;
    show.eventId = eventId;
    show.rooms = rooms;
    Logger.info(`Successfully updated current show: ${JSON.stringify(show)}`)

    axios.get(`https://www.eventbriteapi.com/v3/events/${eventId}/attendees`, 
        {headers: {
            'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
            'Content-Type': 'application/json',
        }}
    ).then((res) => {
        Logger.info(`Attendees from new eventid ${eventId}.`);
        attendees = res.data.attendees.map(attendee => { return {
            profile: attendee.profile,
            ticket: attendee.order_id, }
        });
        // Logger.info(attendees);
        saveShow(show);
        socket.emit(EVENTS.SERVER.ATTENDEE_LIST, attendees);
    }).catch((err) => {
        // inform client that it's invalid
        Logger.error(err);
    })
    socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
    socket.to(ROOM_HOUSE).emit(EVENTS.SERVER.CURRENT_SHOW, show);
}

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