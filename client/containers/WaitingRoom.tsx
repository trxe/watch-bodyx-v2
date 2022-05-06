import { CHANNELS } from "../config/channels"
import styles from "../styles/WaitingRoom.module.css"
import ChatContainer from "./Chat"

const WaitingRoomContainer = () => {
    // PRIVATE CHAT
    // <ChatContainer isAdmin={false} chatName={CHANNELS.SM_ROOM} isQNA={true}/>

    return <div className={styles.waitingRoomWrapper}>
        <h1>Waiting Room</h1>
        <div className={styles.chatWrapper}>
        </div>
    </div>
}

export default WaitingRoomContainer