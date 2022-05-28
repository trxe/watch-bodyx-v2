import { ChatManager } from "./interfaces/chatManager";
import { Client } from "./interfaces/client";
import { Poll } from "./interfaces/poll";
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
let chatManager: ChatManager;
let poll: Poll;

const init = async () => {
    try {
        show = new Show('Sample Show', '302699441177', false);
        await show.loadShow();
    } catch (err) {
        Logger.error(err)
    }
    clients = new Map<string, Client>();
    socketTicket = new Map<string, string>();
    chatManager = new ChatManager(show);
    try {
        poll = new Poll();
        await poll.loadPoll();
    } catch (err) {
        Logger.error(err)
    }
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
 * Sets a client with ticket and socketId to the list of connected clients.
 * @param clientSocketId 
 * @param ticket 
 * @param client 
 */
const setClient = (clientSocketId:string, ticket: string, client: Client): void => {
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

/**
 * Set the current show-specific room client is in.
 * @param socketId 
 * @param roomId 
 * @param onSuccess 
 * @param onFailure 
 */
const setClientRoom = (socketId: string, roomId: string, onSuccess, onFailure) => {
    const clientToSet = getClientBySocket(socketId);
    if (!clientToSet) {
        onFailure();
        return;
    }
    const originalName = clientToSet.roomName;
    show.findRoomNameById(roomId, clientToSet.roomName)
        .then(newRoomName => {
            clients.set(clientToSet.user.ticket, {...clientToSet, roomName: newRoomName});
            if (originalName != newRoomName) {
                onSuccess(clients.get(clientToSet.user.ticket), originalName);
            }
        })
        .catch(onFailure);
}

/**
 * Set the current app-wide channel client is in.
 * @param socketId 
 * @param channelName 
 * @param onSuccess 
 * @param onFailure 
 */
const setClientChannel = (socketId: string, channelName: string, onSuccess, onFailure) => {
    const clientToSet = getClientBySocket(socketId);
    if (!clientToSet) {
        onFailure();
        return;
    }
    const originalName = clientToSet.channelName;
    clients.set(clientToSet.user.ticket, {...clientToSet, channelName: channelName});
    onSuccess(clients.get(clientToSet.user.ticket), originalName);
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
    const users = await UserModel.find({});
    users.forEach(user => {
        user.isPresent = false;
        user.save();
    });
}

async function checkUsers() {
    const users = await UserModel.find({});
    users.forEach(user => {
        console.log('Checking user', user);
    });
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
        delete user['_id'];
        delete user['passwordHash']
        return user;
    } 
    return null;
}

/**
 * Marks the user as present or absent.
 * @param query 
 * @param isPresent
 * @returns the attendee or admin if found, else null.
 */
async function logInOutUser(query, isPresent: boolean): Promise<User> {
    const userDoc = await UserModel.findOne(query);
    if (userDoc != null) {
        userDoc.isPresent = isPresent;
        await userDoc.save((err) => {if (err) Logger.error(err);});
        const user = {...userDoc._doc, isPresent};
        delete user['__v'];
        delete user['_id'];
        delete user['passwordHash'];
        if (show && show.attendees) {
            if (show.attendees.has(user.ticket)) {
                show.attendees.set(user.ticket, user);
            }
        } else if (!show) throw 'Server still loading, please try again in a minute.';
        return user;
    } 
    return null;
}

const getShow = (): Show => show;
const getShowMainRoom = (): string => show.rooms.length == 0 ? null : show.rooms[0].roomName;

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

const getChatManager = () => chatManager;
const getPoll = () => poll;

const Provider = {
    setClient,
    getClientListJSON,
    setClientRoom,
    setClientChannel,
    getClientBySocket, 
    getClientByTicket, 
    removeClientBySocketId, 
    loadUsers,
    checkUsers,
    findUser,
    logInOutUser,
    createRoom,
    updateRoom,
    deleteRoom,
    setShowInfo,
    getShow,
    getShowMainRoom,
    getChatManager,
    getPoll,
    init
}

export default Provider