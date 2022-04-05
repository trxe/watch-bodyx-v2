import { Client } from "./interfaces/client";
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

const getClient = (ticket: string): Client => {
    return clients.has(ticket) ? clients.get(ticket) : null;
}

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

const getShowJSON = (): Object => {
    return show.getJSON();
}

const setShowInfo = (name, eventId, onSuccess, onFailure) => {
    Logger.info(`Updating show name ${name}, show eventId ${eventId}`);
    show.saveShow(name, eventId)
        .then(onSuccess)
        .catch(onFailure);
}


const Provider = {
    addClient,
    getClient, 
    removeClientBySocketId, 
    loadUsers,
    findUser,
    getShowJSON,
    setShowInfo,
    init
}

export default Provider