import { useSockets } from "../context/socket.context"
import styles from "../styles/WaitingRoom.module.css"
import ChatContainer from "./Chat"

const WaitingRoomContainer = () => {
    const {socket, user} = useSockets();
    // PRIVATE CHAT
    // <ChatContainer isAdmin={false} chatName={CHANNELS.SM_ROOM} isQNA={true}/>

    if (!user) return;

    return <div className={styles.waitingRoomWrapper}>
        <h1>Waiting Room</h1>
        <div className={styles.chatWrapper}>
            {socket != null && 
                <ChatContainer chatName={socket.id} isPrivate={true} label={'Need assistance?'} />
            }
        </div>
    </div>
}

export default WaitingRoomContainer