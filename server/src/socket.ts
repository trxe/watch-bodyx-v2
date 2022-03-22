import { Server, Socket } from "socket.io";
import { IRoom } from "./schemas/Room";
import axios from 'axios';
import Logger from "./utils/logger";

const EVENTS = {
    connect: 'connect',
    disconnect: 'disconnect',
    CLIENT: {
        LOGIN: 'LOGIN',
        UPDATE_SHOW: 'UPDATE_SHOW',
        // CREATE_ROOM: 'CREATE_ROOM',
        // JOIN_ROOM: 'JOIN_ROOM',
        // SEND_ROOM_MESSAGE: 'SEND_ROOM_MESSAGE',
    },
    SERVER: {
        PRIVILEGE: 'PRIVILEGE',
        CURRENT_SHOW: 'CURRENT_SHOW',
        ATTENDEE_LIST: 'ATTENDEE_LIST',
        // ROOMS: 'ROOMS',
        // JOINED_ROOM: 'JOINED_ROOM',
        // ROOM_MESSAGE: 'ROOM_MESSAGE',
    }
};

// const rooms: Record<string, {name: string}> = {}
let show: {name: string, eventId: string, rooms: Array<IRoom>} = {
    name: "", 
    eventId: "",
    rooms: []
};

let attendees = [];

const socket = ({io}: { io: Server }) => {

    // on client connection.
    io.on(EVENTS.connect, (socket: Socket) => {
        Logger.info(`User connected ${socket.id}`)

        socket.on(EVENTS.CLIENT.LOGIN, ({ ticket }) => {
            socket.emit(EVENTS.SERVER.PRIVILEGE, 
                { isAdmin: (ticket === 'admin'), ticket }
            );
            socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
        });

        socket.on(EVENTS.CLIENT.UPDATE_SHOW, ({name, eventId, rooms}) => {
            const isEventIdDiff = eventId != show.eventId;
            show = {name, eventId, rooms};
            Logger.info(`Successfully updated current show: ${JSON.stringify(show)}`)

            axios.get(`https://www.eventbriteapi.com/v3/events/${eventId}/attendees`, 
                {headers: {
                    'Authorization': 'Bearer ZCKMNNKTQANXRL4J4JMA',
                    'Content-Type': 'application/json',
                }}
            ).then((res) => {
                Logger.info(`Attendees from new eventid ${eventId}.`);
                attendees = res.data.attendees.map(attendee => { return {
                    profile: attendee.profile,
                    ticket: attendee.order_id, }
                });
                Logger.info(attendees);
                socket.emit(EVENTS.SERVER.ATTENDEE_LIST, attendees);
            }).catch((err) => {
                // inform client that it's invalid
                Logger.error(err);
            })
            socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
        });


        /*
        socket.on(EVENTS.CLIENT.JOIN_ROOM, ({ roomName }) => {
            socket.join(roomName);

            // emit event back to the room creator saying they have joined a room.
            socket.emit(EVENTS.SERVER.JOINED_ROOM, roomName);
        });

        // When user creates new Room
        socket.on(EVENTS.CLIENT.CREATE_ROOM, ({ roomName }) => {
            Logger.info(`Created Room ${roomName}`);
            // add new room to room object
            rooms[roomName] = {
                name: roomName
            }
            socket.join(roomName);

            // broadcast event of rooms list
            socket.broadcast.emit(EVENTS.SERVER.ROOMS, rooms);

            // emit back to room creatorwith listofall rooms
            socket.emit(EVENTS.SERVER.ROOMS, rooms);

            // emit event back to the room creator saying they have joined a room.
            socket.emit(EVENTS.SERVER.JOINED_ROOM, roomName);
        });

        // When user sends a Room message

        socket.on(EVENTS.CLIENT.SEND_ROOM_MESSAGE, ({roomId, message, ticket}) => {
            const date = new Date();
            socket.to(roomId).emit(EVENTS.SERVER.ROOM_MESSAGE, {
                message,
                ticket,
                time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
            })

        });
        */

        socket.on(EVENTS.disconnect, () => {
            Logger.info(`User disconnected ${socket.id}`)
        })
    })
}

export default socket;