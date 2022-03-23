import { useRef, useState } from "react";
import { GrAdd } from 'react-icons/gr'
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboardStyles from '../styles/Dashboard.module.css'
import styles from '../styles/Rooms.module.css'

export interface IRoom {
    name: string;
    url:  string;
}

const RoomsContainer = () => {
    const {socket, show} = useSockets();
    const newRoomName = useRef(null);
    const newRoomUrl = useRef(null);
    const [isAddMode, setAddMode] = useState(false);
    const [isEditMode, setEditMode] = useState(false);
    const [rooms, setRooms] = useState([]);

    const toggleAddMode = () => {
        setAddMode(!isAddMode);
    }

    const handleCreateRoom = () => {
        const newRoom = {name: newRoomName.current.value, 
            url: newRoomUrl.current.value};
        const newShow = {name: show.name, eventId: show.eventId, 
            rooms: [...show.rooms, newRoom]};
        socket.emit(EVENTS.CLIENT.UPDATE_SHOW, newShow);
        console.log(newRoomName.current.value);
        console.log(newRoomUrl.current.value);
        newRoomName.current.value = '';
        newRoomUrl.current.value = '';
        toggleAddMode();
    }

    socket.off(EVENTS.SERVER.CURRENT_SHOW)
        .on(EVENTS.SERVER.CURRENT_SHOW, ({rooms}) => {
            setRooms(rooms);
            console.log(rooms);
        })

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
            {rooms.map((room, index) => <p key={index}>{room.name}: {room.url}</p>)}
        </div>
    </div>
}

export default RoomsContainer;