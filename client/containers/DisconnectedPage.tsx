import { useSockets } from "../context/socket.context"
import styles from "../styles/DisconnectedPage.module.css"

const DisconnectedContainer = () => {
    const {disconnectedInfo} = useSockets();

    return <div className={styles.disconnectedWrapper}>
        <h1>{disconnectedInfo}</h1>
        <p>As such you have been disconnected from BODYX.</p>
        <p>Please contact the administrator for any inquiries.</p>
    </div>
}

export default DisconnectedContainer