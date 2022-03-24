import { FC, useRef, useState } from "react";
import { GrAdd } from 'react-icons/gr'
import { AiFillLock, AiFillUnlock } from "react-icons/ai";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboardStyles from '../styles/Dashboard.module.css'
import styles from '../styles/Rooms.module.css'

export interface IRoom {
    name: string;
    url:  string;
    isLocked: boolean;
    index?: number;
}

const Room:FC<IRoom> = ({name, url, isLocked, index}) => {
    const {socket, show} = useSockets();
    
    const handleToggleLock = () => {
        const newRooms = [...show.rooms];
        newRooms[index] = {name, url, isLocked: !isLocked};
        // console.log(newRooms[index]);
        const newShow = {name: show.name, eventId: show.eventId, 
            rooms: newRooms};
        socket.emit(EVENTS.CLIENT.UPDATE_ROOM, {index, room: newRooms[index]});
    }

    return <div key={index} className={styles.room}>
        <button onClick={handleToggleLock} className='iconButton'>
            {index <= 0 ? 'Main': isLocked ? <AiFillLock/> : <AiFillUnlock/>}
        </button>
        <p className={styles.roomName}>{name}</p>
        <p className={styles.roomUrl}>{url}</p>
    </div>;
}

const RoomsContainer = () => {
    const {socket, show} = useSockets();
    const newRoomName = useRef(null);
    const newRoomUrl = useRef(null);
    const [isAddMode, setAddMode] = useState(false);
    const [isEditMode, setEditMode] = useState(false);

    const toggleAddMode = () => {
        setAddMode(!isAddMode);
    }

    const handleCreateRoom = () => {
        console.log(show);
        const newRoom = {name: newRoomName.current.value, 
            url: newRoomUrl.current.value, isLocked: true};
        socket.emit(EVENTS.CLIENT.CREATE_ROOM, newRoom);
        newRoomName.current.value = '';
        newRoomUrl.current.value = '';
        toggleAddMode();
    }

    return <div className={dashboardStyles.roomsWrapper}>
        <div className={styles.roomHeader}>
            <h2>Rooms</h2>
            <button className={styles.iconButton} onClick={toggleAddMode}>
                <GrAdd />
            </button>
        </div>
        {isAddMode && <div>
            <input placeholder="Room Name" ref={newRoomName}/>
            <input placeholder="URL" ref={newRoomUrl}/>
            <button onClick={handleCreateRoom}>Create</button>
            </div>
        }
        <div>
            {show.rooms && 
                show.rooms.map((room, index) => <Room index={index} name={room.name} url={room.url} isLocked={room.isLocked} />) }
        </div>
    </div>
}
                // show.rooms.map((room, index) => <p key={index}>{room.name}: {room.url}</p>)}

export default RoomsContainer;