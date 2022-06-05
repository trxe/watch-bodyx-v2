import { useSockets } from "../context/socket.context"
import styles from "../styles/WaitingRoom.module.css"
import ChatContainer from "./Chat"

export const AdminChatContainer = () => {
    const {socket} = useSockets();

    return <div className={styles.chatWrapper}>
        {socket != null && 
            <ChatContainer chatName={socket.id} isPrivate={true} label={'Need assistance?'} />}
    </div>;
}

const WaitingRoomContainer = () => {
    const {user} = useSockets();

    if (!user) return;

    return <div className={styles.waitingRoomWrapper}>
        <h1>Waiting Room</h1>
        <AdminChatContainer />
    </div>
}

export default WaitingRoomContainer