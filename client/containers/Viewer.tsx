import { useEffect, useState } from 'react'
import { CHANNELS } from '../config/channels';
import EVENTS from '../config/events';
import { useSockets } from '../context/socket.context';
import styles from '../styles/Viewer.module.css'
import ChatContainer from './Chat';
import UserMenu from './UserMenu';

const ViewerContainer = ({isAdmin}) => {
    const {socket, user, show, roomName, setRoomName} = useSockets();
    const [roomIndex, setRoomIndex] = useState(0)
    const [isChatNotPoll, setChatNotPoll] = useState(true);

    // At startup to enter room
    useEffect(() => {
        handleSwitchRooms(roomIndex);
    }, []);

    // BUGS: on deletion of rooms, roomIndex doesn't update: put into useEffect (roomName).
    const handleSwitchRooms = (index) => {
        if (show.rooms.length == 0) {
            setRoomIndex(-1);
        } else if (isAdmin) {
            setRoomIndex(index);
            setRoomName(show.rooms[index].roomName);
        } else {
            const viewerIndex = index >= show.rooms.length ? 0 : index;
            socket.emit(EVENTS.CLIENT.JOIN_ROOM, show.rooms[viewerIndex]._id, 
                (response) => {
                    console.log(response);
                    setRoomIndex(viewerIndex);
                    console.log("roomName", show.rooms[viewerIndex].roomName);
                    setRoomName(show.rooms[viewerIndex].roomName);
                });
        }
    };

    socket.off(EVENTS.SERVER.FORCE_JOIN_ROOM)
        .on(EVENTS.SERVER.FORCE_JOIN_ROOM, (newRoomName) => {
            const index = show.rooms.findIndex(room => room.name === newRoomName);
            console.log(`joining room ${show.rooms[index].name}`);
            handleSwitchRooms(index);
    });

    if (roomIndex < 0 || !show.rooms || show.rooms.length == 0) {
        return <div className={styles.viewerWrapper}>
            <h1>Rooms Not Available</h1>
        </div>
    }

    return <div className={styles.viewerWrapper}>
        <div className={styles.playerWrapper}>
            <div className={styles.greeter}>
                <UserMenu/>
                <span>Welcome, Detective {user.name}!</span>
            </div>
            <div className={styles.mediaPlayer}>
                <iframe width="100%" height="100%" 
                    src={show.rooms[roomIndex].url}
                    title="YouTube video player" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen></iframe>
            </div>
            <div className={styles.roomButtons}>
                {show.rooms && show.rooms.map && show.rooms.map(({name, isLocked}, index) => 
                    <button onClick={()=> handleSwitchRooms(index)} 
                        disabled={isLocked} key={name}>{name}</button>)}
            </div>
        </div>
        <div className={styles.chatWrapper}>
            {isChatNotPoll ? 'Chat' : 'Poll'} (in progress)
            <ChatContainer chatName={roomName || CHANNELS.SM_ROOM} isAdmin={isAdmin}/>
            <button onClick={() => setChatNotPoll(!isChatNotPoll)}>
                {isChatNotPoll ? 'POLL' : 'CHAT'}
            </button>
        </div>
    </div>
}

export default ViewerContainer;