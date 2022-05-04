import { FC, useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs"
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Clients.module.css"
import DropdownMenu from "../utils/dropdown";

export interface User {
    name: string,
    email: string,
    ticket: string,
    firstName: string,
    isAdmin: boolean
}

export interface Client {
    user: User,
    channelName: string,
    // TODO: RENAME TO NAME or something less confusing
    roomName: string,
    socketId?: string
}

const Client:FC<Client> = ({user, socketId, channelName, roomName}) => {
    const {show, socket, setNotif} = useSockets();

    const kickUser = () => {
        const socketMoveInfo = {socketId, newChannel: CHANNELS.DISCONNECTED};
        socket.emit(EVENTS.CLIENT.MOVE_SOCKET_TO, socketMoveInfo, res => setNotif(res));
        console.log('Kicking', user.name);
    };

    const moveUserToChannel = (newChannel) => {
        const socketMoveInfo = {socketId, newChannel};
        socket.emit(EVENTS.CLIENT.MOVE_SOCKET_TO, socketMoveInfo, res => setNotif(res));
        console.log(`Move ${user.name} to channel`, newChannel);
    };

    const moveUserToRoom = (newRoom) => {
        const socketMoveInfo = {socketId, newRoom};
        socket.emit(EVENTS.CLIENT.MOVE_SOCKET_TO, socketMoveInfo, res => setNotif(res));
        console.log(`Move ${user.name} to room`, newRoom);
    };

    // Dropdown menu will provide a list of actions: kick user, move user to.
    const altChannel = channelName === CHANNELS.WAITING_ROOM ? CHANNELS.MAIN_ROOM : CHANNELS.WAITING_ROOM;
    const altChannelLabel = channelName === CHANNELS.WAITING_ROOM ? "Main Room" : "Waiting Room";
    const dropDownLabels = ['Kick', altChannelLabel, ...show.rooms.map(room => room.name)];
    const dropDownActions = [
        kickUser, 
        () => moveUserToChannel(altChannel),
        ...show.rooms.map(room => () => moveUserToRoom(room.name))
    ];

    return <div className={user.isAdmin ? styles.userAdmin : styles.userViewer}>
        <p>{user.name}</p>
        <p>{user.email}</p>
        <p>{channelName}</p>
        <p>{roomName}</p>
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={dropDownLabels} actions={dropDownActions}/>
    </div>;
}

const UsersContainer = () => {
    const {socket, show} = useSockets();
    const [clients, setClients] = useState(new Map<string, Client>());

    useEffect(() => {
        socket.emit(EVENTS.CLIENT.GET_INFO, {request: 'clients'});
    }, [])

    const getHumanReadableRoomName = (roomName: string) => {
        const room = show.rooms.find(room => room.roomName === roomName);
        if (!room) return roomName;
        else return room.name;
    }

    socket.on(EVENTS.SERVER.CURRENT_CLIENTS, (clientList, callback) => {
        const newClientMap = new Map<string, Client>();
        clientList.forEach(client => {
            newClientMap.set(client.user.ticket, client);
        });
        setClients(newClientMap);
        if (callback != null) callback(socket.id);
    });

    socket.on(EVENTS.SERVER.ADD_CLIENT, (client) => {
        clients.set(client.user.ticket, client);
        setClients(clients);
    })

    socket.on(EVENTS.SERVER.DISCONNECTED_CLIENT, ({ticket, socketId}) => {
        clients.delete(ticket);
        setClients(clients);
    })

    return <div>
        <h2>Users</h2>
        {Array.from(clients.values())
            .map(c => <Client 
                key={c.socketId} 
                socketId={c.socketId} 
                user={c.user} 
                roomName={getHumanReadableRoomName(c.roomName)} 
                channelName={c.channelName}/>)}
    </div>;
}

export default UsersContainer;