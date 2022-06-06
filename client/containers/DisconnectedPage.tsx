import { useState } from "react";
import { useSockets } from "../context/socket.context"
import styles from "../styles/DisconnectedPage.module.css"
import modalStyles from "../styles/Utils.module.css"
import Modal from "../utils/modal";

const CONN_TIMEOUT_MS = 5000;

export const DisconnectedModal = () => {
    const {socket, connectionState, setConnectionState} = useSockets();
    const [isDisabled, setDisabled] = useState(connectionState === 'reconnecting');

    const reconnect = () => {
        socket.connect();
        setConnectionState('reconnecting');
        setDisabled(true);
        setTimeout(() => {
            setDisabled(false);
            if (connectionState === 'reconnecting')
                setConnectionState('disconnected');
        }, CONN_TIMEOUT_MS);
    };

    if (connectionState === 'connected' || connectionState === '') 
        return null;

    return <Modal width={"80%"} id={'disconnected'}>
        <h1>Lost connection</h1>
        <p>Click to reconnect to the server.</p>
        <div className={modalStyles.modalButtons}>
            <button onClick={reconnect} disabled={isDisabled}>Reconnect</button>
        </div>
    </Modal>;
};

const DisconnectedContainer = () => {
    return <div className={styles.disconnectedWrapper}>
        <h1>You have been removed from the BODYX Theatre space.</h1>
        <p>As such you have been disconnected from BODYX.</p>
        <p>Please contact the administrator for any inquiries.</p>
    </div>
}

export default DisconnectedContainer