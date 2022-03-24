import { Server, Socket } from "socket.io";
import { IShow, ShowModel } from "./schemas/Show";
import Logger from "./utils/logger";
import { createNewRoom, getAttendees, updateRoomList, updateShowEvent, verifyAdmin } from "./admin";
import { EVENTS } from "./utils/events";
import { STATUS } from "./utils/ack";
import { joinRoom, socketRoomIndex } from "./viewer";

interface IUser {
    ticket: string;
    isAdmin: boolean;
    eventId?: string;
    roomIndex?: number;
}

/* GLOBALS */
// Main room
export const ROOM_HOUSE = 'house';

let show: IShow = {
    name: "", 
    eventId: "",
    rooms: [],
};

let connectedClients: Map<string, IUser> = new Map<string, IUser>();
let connectedTickets: Map<string, string> = new Map<string, string>();

// convert to an indexed set?
let attendees: Array<{profile: object, ticket: string}> = [];


async function loadShow() {
    const size = await ShowModel.count()
    if (size != 1) {
        await ShowModel.deleteMany({});
        await ShowModel.create({
            name: 'Sample',
            eventId: '302699441177',
            rooms: [],
        })
    }
    show = await ShowModel.findOne();
    // console.log('show load complete:', show);
    attendees = await getAttendees(show.eventId);
    // console.log(attendees);
}

loadShow();

/* SOCKET */
const socket = ({io}: { io: Server }) => {

    // on client connection.
    io.on(EVENTS.connect, (socket: Socket) => {
        Logger.info(`User connected ${socket.id}`)

        socket.on(EVENTS.CLIENT.LOGIN, ({ socketId, ticket }) => {
            if (ticket === 'invalid') {
                socket.emit(EVENTS.SERVER.INVALID_LOGIN, STATUS.INVALID_LOGIN)
                return;
            }

            socket.join(ROOM_HOUSE);
            const isAdmin = ticket === 'admin';
            const user: IUser = {ticket, isAdmin};
            connectedClients.set(socketId, user);
            connectedTickets.set(ticket, socketId);

            socket.emit(EVENTS.SERVER.PRIVILEGE, user);
            socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
            if (isAdmin) {
                socket.emit(EVENTS.SERVER.ATTENDEE_LIST, attendees);
                const temp = Object.fromEntries(connectedClients);
                console.log(temp);
                socket.emit(EVENTS.SERVER.VIEWER_LIST, temp);
            }
        });

        socket.on(EVENTS.CLIENT.UPDATE_SHOW, ({name, eventId, rooms}) => 
            updateShowEvent({name, eventId, rooms}, socket, show, attendees)
        );

        socket.on(EVENTS.CLIENT.JOIN_ROOM, ({index}, callback) => {
            joinRoom({index}, socket, show, connectedClients.get(socket.id), callback)
        });

        socket.on(EVENTS.CLIENT.CREATE_ROOM, (newRoom) => {
            const user = connectedClients.get(socket.id);
            if (!verifyAdmin(user, socket)) return;
            createNewRoom(newRoom, socket, show);
        });

        socket.on(EVENTS.CLIENT.UPDATE_ROOM, ({index, room}) => {
            const user = connectedClients.get(socket.id);
            updateRoomList({index, room}, socket, user, show);
        })

        socket.on(EVENTS.disconnect, () => {
            Logger.info(`Disconnecting user ${socket.id}`);
            const user = connectedClients.get(socket.id);
            if (!user) return;
            connectedClients.delete(socket.id);
            connectedTickets.delete(user.ticket);
        })
    })
}

export default socket;