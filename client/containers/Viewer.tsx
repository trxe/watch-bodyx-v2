import { useEffect, useState } from 'react'
import { CHANNELS } from '../config/channels';
import EVENTS from '../config/events';
import { useSockets } from '../context/socket.context';
import styles from '../styles/Viewer.module.css'
import ChatContainer from './Chat';
import UserMenu from './UserMenu';

const ViewerContainer = () => {
    const {socket, user, show, setRoom} = useSockets();
    const [roomIndex, setRoomIndex] = useState(0)
    const [isChatNotPoll, setChatNotPoll] = useState(true);

    // At startup to enter room
    useEffect(() => {
        handleSwitchRooms(roomIndex);
    }, []);

    const handleSwitchRooms = (index) => {
        socket.emit(EVENTS.CLIENT.JOIN_ROOM, show.rooms[index]._id, 
            (response) => {
                console.log(response);
                setRoomIndex(index);
            });
    };

    socket.off(EVENTS.SERVER.FORCE_JOIN_ROOM)
        .on(EVENTS.SERVER.FORCE_JOIN_ROOM, (newRoomName) => {
            const index = show.rooms.findIndex(room => room.name === newRoomName);
            console.log(`joining room ${show.rooms[index].name}`);
            handleSwitchRooms(index);
    });

    if (!show.rooms || show.rooms.length == 0) {
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
                {show.rooms && show.rooms.map && show.rooms.map(({name, url, isLocked}, index) => 
                    <button onClick={()=> handleSwitchRooms(index)} 
                        disabled={isLocked} key={name}>{name}</button>)}
            </div>
        </div>
        <div className={styles.chatWrapper}>
            {isChatNotPoll ? 'Chat' : 'Poll'} (in progress)
            <ChatContainer chatName={CHANNELS.MAIN_ROOM}/>
            <button onClick={() => setChatNotPoll(!isChatNotPoll)}>
                {isChatNotPoll ? 'POLL' : 'CHAT'}
            </button>
        </div>
    </div>
}

export default ViewerContainer;