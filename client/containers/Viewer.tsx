import { useState } from 'react'
import EVENTS from '../config/events';
import { useSockets } from '../context/socket.context';
import styles from '../styles/Viewer.module.css'
import UserMenu from './UserMenu';

const ViewerContainer = () => {
    const {socket, show} = useSockets();
    const [src, setSrc] = useState('')
    const [isChatNotPoll, setChatNotPoll] = useState(true);
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    // return <p>Viewer</p>;
    if (socket != null) {
        socket.on(EVENTS.SERVER.CURRENT_SHOW, ({rooms}) => {
            if (rooms.length == 0) {
                setSrc('');
            } else if (src.length == 0) {
                setSrc(rooms[0].url);
            }
        });
    }

    return <div className={styles.viewerWrapper}>
        <div className={styles.playerWrapper}>
            <div className={styles.greeter}>
                <UserMenu/>
                <span>Welcome, Detective X!</span>
            </div>
            <div className={styles.mediaPlayer}>
                {src.length  != 0 &&
                    <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/s4BibernJxU" 
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen></iframe>}
            </div>
            <div className={styles.roomButtons}>
                {show.rooms && show.rooms.map && show.rooms.map(({name, url}) => <button key={name}>{name}</button>)}
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