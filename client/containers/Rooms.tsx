import { FC, useRef, useState } from "react";
import { GrAdd } from 'react-icons/gr'
import { AiFillEdit, AiFillLock, AiFillUnlock, AiOutlineCheck, AiOutlineClose, AiOutlineDelete } from "react-icons/ai";
import { BsXDiamond } from "react-icons/bs"
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Rooms.module.css'
import { createNotif } from "./Snackbar";
import { classList } from "../utils/utils";

export interface IRoom {
    name: string;
    url:  string;
    isLocked: boolean;
    index?: number;
    roomName?: string;
    _id?: string;
}

const Room:FC<IRoom> = ({name, url, isLocked, _id, roomName, index}) => {
    const {socket, show, setShow, setNotif} = useSockets();
    const [isEditMode, setEditMode] = useState(false);
    const nameRef = useRef(null);
    const urlRef = useRef(null);
    
    const handleToggleLock = () => {
        const updatedRoom = {name, url, isLocked: !isLocked, _id};
        sendUpdateRoom(updatedRoom);
    }

    const handleEditRoom = () => {
        const updatedName = nameRef.current.value;
        const updatedUrl = urlRef.current.value;
        if (!updatedName || !updatedUrl || updatedName === '' || updatedUrl === '') {
            setNotif(createNotif('error', 'Missing fields', 'Please enter a valid room name and url.'))
            return;
        }
        if (updatedName == name && updatedUrl == url) {
            setEditMode(false);
            return;
        }
        // check if other rooms contain this name.
        const found = show.rooms.find(
            room => room.name === updatedName && room._id != _id
        );
        if (found) {
            setNotif(createNotif('error', 'Duplicate room name', 'Please enter a unique room name.'))
            return;
        }
        const updatedRoom = {
            name: updatedName, 
            url: updatedUrl, 
            isLocked: !isLocked,
            roomName,
            _id
        };
        nameRef.current.value = '';
        urlRef.current.value = '';
        setEditMode(false);
        sendUpdateRoom(updatedRoom);
    }

    const handleDeleteRoom = () => {
        socket.emit(EVENTS.CLIENT.DELETE_ROOM, _id,
            res => { setNotif(res) }
        );
    }

    const sendUpdateRoom = (room: IRoom) => {
        socket.emit(EVENTS.CLIENT.UPDATE_ROOM, room,
            res => { 
                console.log(res.title, typeof res.title);
                if (res.messageType === 'info') {
                    const newRooms = [...show.rooms];
                    newRooms[index] = res.title;
                    setShow({...show, rooms: newRooms});
                } else {
                    setNotif(res) ;
                }
            }
        );
    }
    
    const toggleEditMode = () => {
        setEditMode(!isEditMode);
    }

    return <div className={styles.room}>
        {!isEditMode &&
            <button onClick={handleToggleLock} className='iconButton'>
                {index <= 0 ? 'M': isLocked ? <AiFillLock/> : <AiFillUnlock/>}
            </button>
        }
        {isEditMode && <button className='iconButton' onClick={handleDeleteRoom}><AiOutlineDelete/></button>}
        {!isEditMode && <p className={styles.roomName}>{name}</p> }
        {!isEditMode && <p className={styles.roomUrl}>{url}</p> }
        {isEditMode && <input className={styles.roomName} defaultValue={name} ref={nameRef}/>}
        {isEditMode && <input className={styles.roomUrl} defaultValue={url} ref={urlRef}/>}
            
        <button onClick={isEditMode ? handleEditRoom: toggleEditMode} className='iconButton'>
            {isEditMode ? <AiOutlineCheck/> : <AiFillEdit/>}
        </button>
    </div>;
}

const RoomsContainer = (props) => {
    const {socket, show, setShow, setNotif} = useSockets();
    const [styling, setStyling] = useState({opacity: '0', height: '0'});
    const newRoomName = useRef(null);
    const newRoomUrl = useRef(null);
    const [isAddMode, setAddMode] = useState(false);

    const toggleAddMode = () => {
        setStyling(!isAddMode ? {opacity: '100', height: '3em'} : {opacity: '0', height: '0'})
        setAddMode(!isAddMode);
    }

    const handleCreateRoom = () => {
        // check if other rooms contain this name.
        const found = show.rooms.find(room => room.name === newRoomName.current.value);
        if (found) {
            setNotif(createNotif('error', 'Duplicate room name', 'Please enter a unique room name.'))
            return;
        }
        let newRoom: IRoom = {name: newRoomName.current.value, 
            url: newRoomUrl.current.value, isLocked: show.rooms.length == 0};
        socket.emit(EVENTS.CLIENT.CREATE_ROOM, newRoom,
            (res) => {
                // server should return the room created
                if (res.messageType === 'info') newRoom = res.message;
                else setNotif(res);
            }
            );
        newRoomName.current.value = '';
        newRoomUrl.current.value = '';
        toggleAddMode();
    }

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <BsXDiamond/>
            <div className={dashboard.containerTitle}>ROOMS</div>
            <button onClick={toggleAddMode}>
                {!isAddMode ? <GrAdd /> : <AiOutlineClose/>}
            </button>
        </div>
        <div className={dashboard.containerContent}>
            {show.rooms && 
                show.rooms.map((room, index) => <Room 
                    key={room._id} 
                    index={index} 
                    {...room}
                    />) 
                }
            <div className={styles.room} style={styling}>
                <button className='iconButton' onClick={toggleAddMode}><AiOutlineClose/></button>
                <input className={styles.roomName} placeholder="Room Name" ref={newRoomName}/>
                <input className={styles.roomUrl} placeholder="URL" ref={newRoomUrl}/>
                <button onClick={handleCreateRoom} className='iconButton'><AiOutlineCheck/></button>
            </div>
        </div>
    </div>
}

export default RoomsContainer;