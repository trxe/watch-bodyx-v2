/* SOCKET */
const socket = ({io}: { io: Server }) => {

    // on client connection.
    /*

let connectedClients: Map<string, IUser> = new Map<string, IUser>();
let connectedTickets: Map<string, string> = new Map<string, string>();

let attendees: Map<string, IAttendee> = new Map<string, IAttendee>();
    io.on(EVENTS.connect, (socket: Socket) => {
        Logger.info(`User connected ${socket.id}`)

        socket.on(EVENTS.CLIENT.LOGIN, ({ socketId, ticket }) => {
            if (ticket === 'invalid') {
                socket.emit(EVENTS.SERVER.INVALID_LOGIN, STATUS.INVALID_LOGIN)
                return;
            }

            socket.join(ROOM_HOUSE);
            const isAdmin = ticket === 'admin';
            const user: IUser = (!attendees || !attendees.has(ticket)) ? 
                {ticket, isAdmin} : {name: attendees.get(ticket).name, ticket, isAdmin};
            connectedClients.set(socketId, user);
            connectedTickets.set(ticket, socketId);

            socket.emit(EVENTS.SERVER.PRIVILEGE, user);
            socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
            Logger.info(show);
            if (isAdmin) {
                const temp = Object.fromEntries(connectedClients);
                console.log(temp);
                socket.emit(EVENTS.SERVER.USER_LIST, temp);
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
    */
}

export default socket;