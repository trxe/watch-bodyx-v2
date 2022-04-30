import { useState } from 'react'
import EVENTS from '../config/events';
import { useSockets } from '../context/socket.context';
import styles from '../styles/Viewer.module.css'
import UserMenu from './UserMenu';

const ViewerContainer = () => {
    const {socket, user, show} = useSockets();
    const [roomIndex, setRoomIndex] = useState(0)
    const [isChatNotPoll, setChatNotPoll] = useState(true);

    const handleSwitchRooms = (index) => {
        console.log(socket.id);
        socket.emit(EVENTS.CLIENT.JOIN_ROOM, show.rooms[index]._id, 
            (response) => {
                console.log(response);
                setRoomIndex(index);
            });
    };

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
            <button onClick={() => setChatNotPoll(!isChatNotPoll)}>
                {isChatNotPoll ? 'POLL' : 'CHAT'}
            </button>
        </div>
    </div>
}

export default ViewerContainer;