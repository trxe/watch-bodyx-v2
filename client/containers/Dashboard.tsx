import { useRef, useState } from "react";
import EVENTS from "../config/events";
import styles from "../styles/Dashboard.module.css"
import { useSockets } from "../context/socket.context";
import RoomsContainer from "./Rooms";
import UserMenu from "./UserMenu";
import UsersContainer from "./Clients";
import AttendeesContainer from "./Attendees";
import { CHANNELS } from "../config/channels";
import ViewerContainer from "./Viewer";
import { MODES } from "../config/modes";
import QNAContainer from "./QnA";
import { SampleModal } from "../utils/modal";
import PollSettingsContainer from "./Poll";

const DashboardContainer = () => {
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    const {socket, show, setNotif} = useSockets();
    const [isEditMode, setEditMode] = useState(false);
    const [mode, setMode] = useState(MODES.DASHBOARD);
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);

    const handleUpdateShow = () => {
        if (newShowTitle.current.value == show.name &&
            newEventId.current.value == show.eventId) {
                setEditMode(false);
                return;
            }
        setNotif({messageType: 'warning', title: 'Loading event info...', 
            message: 'Loading event from server.'})
        socket.emit(EVENTS.CLIENT.UPDATE_SHOW, {
            name: newShowTitle.current.value,
            eventId: newEventId.current.value,
        }, (res) => {
            setNotif(res);
        });
        setEditMode(false);
    }

    const toggleShowStart = () => {
        console.log('Toggle show start', !show.isOpen);
        socket.emit(EVENTS.CLIENT.TOGGLE_SHOW_START, {
            fromChannel: !show.isOpen ? CHANNELS.WAITING_ROOM : CHANNELS.MAIN_ROOM,
            toChannel: !show.isOpen ? CHANNELS.MAIN_ROOM : CHANNELS.WAITING_ROOM,
            isShowOpen: !show.isOpen
        }, (res) => {
            setNotif(res);
        });
    }

    const showInfo = isEditMode ?
        <div className={styles.editShowInfo}>
            <input placeholder='Show Title' 
                ref={newShowTitle} 
                defaultValue={show.name}
            />
            <input placeholder='Event ID' 
                ref={newEventId}
                defaultValue={show.eventId}
            />
            <button onClick={handleUpdateShow}>UPDATE</button>
        </div> :
        <div className={styles.showInfo}>
            <p>Show Title: {show.name}</p>
            <p className={!show.attendees ? styles.error : styles.success}>Event ID: {show.eventId}</p>
            <button onClick={toggleShowStart}>{show.isOpen ? 'END' : 'START'}</button>
        </div>

    if (mode == MODES.THEATRE) {
        return <div className={styles.dashboardWrapper}>
            <UserMenu/>
            <button onClick={() => setMode(MODES.DASHBOARD)}>{MODES.DASHBOARD}</button>
            <button onClick={() => setMode(MODES.QNA)}>{MODES.QNA}</button>
            <ViewerContainer isAdmin={true} />
        </div>;
    }
    
    if (mode == MODES.QNA) {
        return <div className={styles.dashboardWrapper}>
            <UserMenu/>
            <button onClick={() => setMode(MODES.THEATRE)}>{MODES.THEATRE}</button>
            <button onClick={() => setMode(MODES.QNA)}>{MODES.QNA}</button>
            <QNAContainer />
        </div>;
    }

    return <div className={styles.dashboardWrapper}>
        <UserMenu/>
        <button onClick={() => setMode(MODES.THEATRE)}>{MODES.THEATRE}</button>
        <button onClick={() => setMode(MODES.QNA)}>{MODES.QNA}</button>
        <h1>Show Settings</h1>
        {showInfo}
        <button onClick={() => setEditMode(!isEditMode)}>
            {isEditMode ? 'CANCEL' : 'EDIT'}
        </button>
        <div className={styles.bottom}>
            <div className={styles.attendeesWrapper}>
                <AttendeesContainer/>
                <UsersContainer/>
            </div>
            <div className={styles.roomsWrapper}>
                <RoomsContainer />
                <PollSettingsContainer/>
            </div>
        </div>
    </div>;
}

export default DashboardContainer;