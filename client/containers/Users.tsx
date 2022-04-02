import { FC, useState } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Users.module.css"

export interface IUser {
    ticket: string;
    isAdmin: boolean;
    eventId?: string;
    roomIndex?: number;
}

const User:FC<IUser> = ({ticket, isAdmin, eventId, roomIndex}) => {
    const kickUser = () => {
        console.log("kicking", ticket);
    };

    return <div key={ticket} className={isAdmin ? styles.userAdmin : styles.userViewer}>
        <button onClick={kickUser}>Kick</button>
    </div>;
}

const UsersContainer = () => {
    const {socket} = useSockets();
    const [users, setUsers] = useState({});

    socket.on(EVENTS.SERVER.USER_LIST, (value) => {
        setUsers(value);
    })
    console.log('users', Object.entries(users).map(([key, value]) => `${key} ${value}`));

    return <div>
        <h2>Users</h2>
        {Object.entries(users).map(([key, value]) => 
            <p key={key}>{key}: {JSON.stringify(value)}</p>)}
    </div>;
}

export default UsersContainer;