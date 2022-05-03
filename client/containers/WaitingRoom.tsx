import { CHANNELS } from "../config/channels"
import styles from "../styles/WaitingRoom.module.css"
import ChatContainer from "./Chat"

const WaitingRoomContainer = () => {
    return <div className={styles.waitingRoomWrapper}>
        <h1>Waiting Room</h1>
        <div className={styles.chatWrapper}>
            <ChatContainer isAdmin={false} chatName={CHANNELS.SM_ROOM}/>
        </div>
    </div>
}

export default WaitingRoomContainer