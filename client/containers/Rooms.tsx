import { FC, useRef, useState } from "react";
import { GrAdd } from 'react-icons/gr'
import { AiFillEdit, AiFillLock, AiFillUnlock, AiOutlineCheck, AiOutlineClose, AiOutlineDelete } from "react-icons/ai";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboardStyles from '../styles/Dashboard.module.css'
import styles from '../styles/Rooms.module.css'
import { createNotif } from "./Snackbar";
import ToggleButton from "../utils/toggleButton";
import { useChatRooms } from "../context/chats.context";

export interface IRoom {
    name: string;
    url:  string;
    isLocked: boolean;
    index?: number;
    _id?: string;
}

const Room:FC<IRoom> = ({name, url, isLocked, _id, index}) => {
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
        {!isEditMode && <p className={styles.roomName}>{name}</p> }
        {!isEditMode && <p className={styles.roomUrl}>{url}</p> }
        {isEditMode && <input className={styles.roomName} defaultValue={name} ref={nameRef}/>}
        {isEditMode && <input className={styles.roomUrl} defaultValue={url} ref={urlRef}/>}
        {isEditMode && <button className='iconButton' onClick={handleEditRoom}><AiOutlineCheck/></button>}
            
        <button onClick={isEditMode ? handleDeleteRoom: toggleEditMode} className='iconButton'>
            {isEditMode ? <AiOutlineDelete/> : <AiFillEdit/>}
        </button>
    </div>;
}

const RoomsContainer = () => {
    const {socket, show, setShow, setNotif} = useSockets();
    const {isViewerChatEnabled, setViewerChatEnabled} = useChatRooms();
    const newRoomName = useRef(null);
    const newRoomUrl = useRef(null);
    const [isAddMode, setAddMode] = useState(false);

    const toggleAddMode = () => {
        setAddMode(!isAddMode);
    }

    const handleCreateRoom = () => {
        // check if other rooms contain this name.
        const found = show.rooms.find(room => room.name === newRoomName.current.value);
        if (found) {
            setNotif(createNotif('error', 'Duplicate room name', 'Please enter a unique room name.'))
            return;
        }
        const newRoom: IRoom = {name: newRoomName.current.value, 
            url: newRoomUrl.current.value, isLocked: show.rooms.length == 0};
        socket.emit(EVENTS.CLIENT.CREATE_ROOM, newRoom,
            (res) => {
                // server should return the room database id.
                console.log(res);
                if (res.messageType === 'info') newRoom._id = res.message;
                else setNotif(res);
            }
            );
        newRoomName.current.value = '';
        newRoomUrl.current.value = '';
        toggleAddMode();
    }

    const toggleAudienceChat = () => {
        console.log("Toggle audience chat");
        console.log({status: isViewerChatEnabled});
        socket.emit(EVENTS.CLIENT.ADMIN_TOGGLE_AUDIENCE_CHAT, 
            {status: isViewerChatEnabled},
            (res) => setViewerChatEnabled(res.status));
    }

    return <div className={dashboardStyles.roomsWrapper}>
        <div className={styles.roomHeader}>
            <h2>Rooms</h2>
            <button className={styles.iconButton} onClick={toggleAddMode}>
                {!isAddMode ? <GrAdd /> : <AiOutlineClose/>}
            </button>
            <ToggleButton label="Audience Chat" action={toggleAudienceChat} isSelected={isViewerChatEnabled}/>
        </div>
        {isAddMode && <div>
            <input placeholder="Room Name" ref={newRoomName}/>
            <input placeholder="URL" ref={newRoomUrl}/>
            <button onClick={handleCreateRoom}>Create</button>
            </div>
        }
        <div>
            {show.rooms && 
                show.rooms.map((room, index) => <Room 
                    key={room._id} 
                    index={index} 
                    name={room.name} 
                    url={room.url} 
                    isLocked={room.isLocked} 
                    _id={room._id} />) 
                }
        </div>
    </div>
}

export default RoomsContainer;