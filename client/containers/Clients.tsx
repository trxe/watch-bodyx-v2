import { FC, useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical, BsPeople } from "react-icons/bs"
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboard from '../styles/Dashboard.module.css'
import styles from "../styles/Clients.module.css"
import DropdownMenu from "../utils/dropdown";
import { classList } from "../utils/utils";
import { BiLink, BiRefresh } from "react-icons/bi";

export interface User {
    name: string,
    email: string,
    ticket: string,
    firstName: string,
    isAdmin: boolean
    isPresent: boolean,
    hasAttended: boolean,
    eventId?: string,
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

    return <div className={classList(styles.user, user.isAdmin ? styles.admin : styles.viewer)}>
        <button className={styles.icon}><BiLink/></button>
        <div className={styles.shortField}>{user.name}</div>
        <div className={styles.shortField}>{user.email}</div>
        <div className={styles.shortField}>{channelName}</div>
        <div className={styles.shortField}>{roomName}</div>
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={dropDownLabels} actions={dropDownActions}/>
    </div>;
}

const UsersContainer = (props) => {
    const {socket, show, clientsList} = useSockets();
    const [filterKeyword, setFilterKeyword] = useState('')
    const [filterType, setFilterType] = useState('Name')
    const filterRef = useRef(null);

    const contains = (client: Client) => {
        if (filterType === 'Name') {
            return client.user.name.indexOf(filterKeyword) >= 0;
        } else if (filterType === 'Email') {
            return client.user.email.indexOf(filterKeyword) >= 0;
        } else if (filterType === 'Channel') {
            if (!client.channelName) return false;
            return client.channelName.indexOf(filterKeyword) >= 0;
        } else if (filterType === 'Room') {
            if (!client.roomName) return false;
            return client.roomName.indexOf(filterKeyword) >= 0;
        } else {
            return client.user.name.indexOf(filterKeyword) >= 0;
        }
    }

    const changeFilter = () => {
        if (filterRef.current && filterRef.current.value) 
            setFilterKeyword(filterRef.current.value);
        else setFilterKeyword('');
    }

    const filterTypeLabels = [ 'Name', 'Email', 'Channel', 'Room' ];

    const filterTypeActions = filterTypeLabels.map(word => () => setFilterType(word));

    const requestClients = () => {
        socket.emit(EVENTS.CLIENT.GET_INFO, {request: 'clients'});
    }

    const getHumanReadableRoomName = (roomName: string) => {
        const room = show.rooms.find(room => room.roomName === roomName);
        if (!room) return roomName;
        else return room.name;
    }

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <BsPeople/>
            <div className={dashboard.containerTitle}>USERS PRESENT</div>
            <div className={styles.search}>
                <input onChange={changeFilter} ref={filterRef} placeholder={filterType}/>
                <DropdownMenu title="Filter" labels={filterTypeLabels} actions={filterTypeActions}/>
            </div>
            <div className={classList(dashboard.refresh)} onClick={requestClients}><BiRefresh/></div>
        </div>
        <div className={dashboard.containerContent}>
            <div className={classList(styles.user, styles.header)}>
                <button style={{opacity: 0, cursor: 'auto'}} className={styles.icon}><BiLink/></button>
                <div className={styles.shortField}>NAME</div>
                <div className={styles.shortField}>EMAIL</div>
                <div className={styles.shortField}>CHANNEL</div>
                <div className={styles.shortField}>ROOM</div>
                <DropdownMenu style={{opacity: 0, cursor: 'none'}} title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
            </div>
            {clientsList.filter(contains).map(c => <Client 
                key={c.socketId} 
                socketId={c.socketId} 
                user={c.user} 
                roomName={getHumanReadableRoomName(c.roomName)} 
                channelName={c.channelName}/>)}
        </div>
    </div>;
}

export default UsersContainer;