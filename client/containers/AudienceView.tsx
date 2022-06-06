import { useState } from "react";
import { MODES } from "../config/modes";
import { useChatRooms } from "../context/chats.context";
import { MdLiveHelp, MdOutlineTheaters } from "react-icons/md";
import { AiOutlineMenu } from "react-icons/ai";
import ViewerContainer from "./Viewer";
import styles from "../styles/AudienceView.module.css"
import { AdminChatContainer } from "./WaitingRoom";

const NavbarContainer = ({mode, setMode}) => {
    const {unreadCounts} = useChatRooms();
    return <div className={styles.navbar}>
        {mode !== MODES.THEATRE && 
            <button onClick={() => setMode(MODES.THEATRE)} className={styles.locationButton}>
                <MdOutlineTheaters />
            </button>}
        {mode !== MODES.QNA && 
            <button onClick={() => setMode(MODES.QNA)} className={styles.locationButton}>
                <MdLiveHelp />{unreadCounts[MODES.QNA] > 0 && <span className={styles.badge}>{unreadCounts[MODES.QNA]}</span>}
            </button>}
        <button className={styles.otherButton}><AiOutlineMenu /></button>
    </div>;
}

const AudienceViewContainer = () => {
    const [mode, setMode] = useState(MODES.THEATRE);

    if (mode === MODES.THEATRE) {
        // TODO: Similar to Dashboard.
        return <div className={styles.audienceView}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <ViewerContainer/>
        </div>;
    } else if (mode === MODES.QNA) {
        // TODO: Replace with the QNA chat container.
        return <div className={styles.audienceView}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <AdminChatContainer />
            </div>
        </div>;
    }
}

export default AudienceViewContainer;