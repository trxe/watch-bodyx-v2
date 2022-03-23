import { Server, Socket } from "socket.io";
import { IRoom } from "./schemas/Room";
import Logger from "./utils/logger";
import { updateShowEvent } from "./admin";
import { EVENTS } from "./utils/events";
import { STATUS } from "./utils/ack";

// const rooms: Record<string, {name: string}> = {}
let show: {name: string, eventId: string, rooms: Array<IRoom>} = {
    name: "", 
    eventId: "",
    rooms: [
        {name: 'Nasty', url: 'lmao'},
        {name: 'Nastier', url: 'lmao'},
        {name: 'Nastiest', url: 'lmao'},
    ]
};

let attendees: Array<{profile: object, ticket: string}> = [];

const socket = ({io}: { io: Server }) => {
    // on client connection.
    io.on(EVENTS.connect, (socket: Socket) => {
        Logger.info(`User connected ${socket.id}`)

        socket.on(EVENTS.CLIENT.LOGIN, ({ ticket }) => {
            if (ticket === 'invalid') {
                socket.emit(EVENTS.SERVER.INVALID_LOGIN, STATUS.INVALID_LOGIN)
                return;
            }
            const isAdmin = ticket === 'admin';

            socket.emit(EVENTS.SERVER.PRIVILEGE, 
                { isAdmin, ticket }
            );
            socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
            Logger.info('sent current info to client.')
        });

        socket.on(EVENTS.CLIENT.UPDATE_SHOW, ({name, eventId, rooms}) => 
            updateShowEvent({name, eventId, rooms}, socket, show, attendees)
        );


        socket.on(EVENTS.disconnect, () => {
            Logger.info(`User disconnected ${socket.id}`)
        })
    })
}

export default socket;