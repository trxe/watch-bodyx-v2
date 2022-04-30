import { FC, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs"
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
    roomName: string,
    socketId?: string
}

const Client:FC<Client> = ({user, roomName}) => {
    const dropDownLabels = ['opt1', 'opt2'];
    const dropDownActions = [() => console.log('opt1'), () => console.log('opt2')];
    // Dropdown menu will provide a list of actions: kick user, move user to.
    const kickUser = () => {
        console.log("kicking", user.ticket);
    };

    return <div className={user.isAdmin ? styles.userAdmin : styles.userViewer}>
        <p>{user.name}</p>
        <p>{user.email}</p>
        <p>{user.ticket}</p>
        <p>{roomName}</p>
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={dropDownLabels} actions={dropDownActions}/>
    </div>;
}

const UsersContainer = () => {
    const {socket} = useSockets();
    const [clients, setClients] = useState(new Map<string, Client>());

    socket.on(EVENTS.SERVER.CURRENT_CLIENTS, (clientList, callback) => {
        console.log("clients", clientList);
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

    socket.on(EVENTS.SERVER.DISCONNECTED_CLIENT, (ticket) => {
        clients.delete(ticket);
        setClients(clients);
    })

    return <div>
        <h2>Users</h2>
        {Array.from(clients.values())
            .map(c => <Client key={c.socketId} user={c.user} roomName={c.roomName} />)}
    </div>;
}

export default UsersContainer;