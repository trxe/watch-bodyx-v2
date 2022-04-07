import { Client } from "./interfaces/client";
import { Room } from "./interfaces/room";
import { Show } from "./interfaces/show";
import { User } from "./interfaces/users";
import { UserModel } from "./schemas/userSchema";
import Logger from "./utils/logger";
/**
 * Contains the server's state information.
 */

let show: Show;
let clients: Map<string, Client>;
let socketTicket: Map<string, string>;

const init = () => {
    show = new Show('Sample Show', '302699441177');
    show.loadShow();
    clients = new Map<string, Client>();
    socketTicket = new Map<string, string>();
};

/**
 * Gets a client by its socket.id 
 * @param clientSocketId 
 * @returns ticket of removed client.
 */
const removeClientBySocketId = (clientSocketId: string): string => {
    const ticket = socketTicket.get(clientSocketId);
    clients.delete(ticket);
    socketTicket.delete(clientSocketId);
    return ticket;
}

/**
 * Adds a client to the list of connected clients.
 * @param clientSocketId 
 * @param ticket 
 * @param client 
 */
const addClient = (clientSocketId:string, ticket: string, client: Client): void => {
    clients.set(ticket, client);
    socketTicket.set(clientSocketId, ticket);
}

const getClientByTicket = (ticket: string): Client => {
    return clients.has(ticket) ? clients.get(ticket) : null;
}

const getClientBySocket = (socketId: string): Client => {
    return socketTicket.has(socketId) ? 
        getClientByTicket(socketTicket.get(socketId)) : null;
}

const getClientListJSON = (): Array<Object> => {
    return Array.from(clients.values());
}

const setClientRoom = (socketId: string, roomId: string, onSuccess, onFailure) => {
    const clientToSet = getClientBySocket(socketId);
    const originalName = clientToSet.roomName;
    show.findRoomNameById(roomId, clientToSet.roomName)
        .then(newRoomName => {
            clients.set(clientToSet.user.ticket, {...clientToSet, roomName: newRoomName});
            if (originalName != newRoomName) {
                onSuccess();
            }
        })
        .catch(onFailure);
}

// TODO
const changeClientRoom = () => {}

/**
 * Loads users from database. Contains only admins at startup.
 */
async function loadUsers() {
    const size = await UserModel.count();
    if (size == 0) {
        await UserModel.create({
            name: 'admin',
            email: 'admin',
            ticket: 'bodyx',
            firstName: 'admin',
            isAdmin: true
        });
    }
}

/**
 * Finds a user in the database or in attendee list by a query.
 * @param query 
 * @returns the attendee or admin if found, else null.
 */
async function findUser(query): Promise<User> {
    const userDoc = await UserModel.findOne(query);
    if (userDoc != null) {
        const user = {...userDoc._doc};
        delete user['__v']
        return user;
    } 
    const newAttendee = show.findAttendee(query.ticket, query.email);
    if (newAttendee != null) {
        return newAttendee;
    }
    return null;
}

const getShowJSON = (): Object => show.getJSON();
const getRoomsJSON = (): Object => show.getJSON().rooms;

const setShowInfo = (name: string, eventId: string, onSuccess, onFailure) => {
    Logger.info(`Updating show name ${name}, show eventId ${eventId}`);
    show.saveShow(name, eventId)
        .then(onSuccess)
        .catch(onFailure);
}

const createRoom = (name: string, url: string, isLocked, onSuccess, onFailure) => {
    Logger.info(`Creating room ${name}; url: ${url}`);
    show.createRoom(name, url, isLocked)
        .then(onSuccess)
        .catch(onFailure);
}

const updateRoom = (room: Room, onSuccess, onFailure) => {
    Logger.info(`Updating room ${room.name}; id: ${room._id}`);
    show.updateRoom(room)
        .then(onSuccess)
        .catch(onFailure);
}

const deleteRoom = (_id: string, onSuccess, onFailure) => {
    Logger.info(`Deleting room with id ${_id}`);
    show.deleteRoom(_id)
        .then(onSuccess)
        .catch(onFailure);
}

const Provider = {
    addClient,
    getClientListJSON,
    setClientRoom,
    getClientBySocket, 
    removeClientBySocketId, 
    loadUsers,
    findUser,
    createRoom,
    updateRoom,
    deleteRoom,
    getShowJSON,
    getRoomsJSON,
    setShowInfo,
    init
}

export default Provider