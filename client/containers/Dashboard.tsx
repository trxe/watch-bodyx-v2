import { FC, useRef, useState } from "react";
import EVENTS from "../config/events";
import styles from "../styles/Dashboard.module.css"
import { useSockets } from "../context/socket.context";
import RoomsContainer from "./Rooms";
import UserMenu from "./UserMenu";
import UsersContainer from "./Users";
import AttendeesContainer from "./Attendees";

const DashboardContainer = () => {
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    const {socket, show} = useSockets();
    const [isEditMode, setEditMode] = useState(false);
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);

    const handleUpdateShow = () => {
        if (newShowTitle.current.value == show.name &&
            newEventId.current.value == show.eventId) {
                setEditMode(false);
                return;
            }
        socket.emit(EVENTS.CLIENT.UPDATE_SHOW, {
            ...show,
            name: newShowTitle.current.value,
            eventId: newEventId.current.value,
        });
        setEditMode(false);
        // MUST wait for ack HERE: to be implemented.
    }

    const mode = isEditMode ?
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
            <p>Event ID: {show.eventId}</p>
            <button>START</button>
        </div>
    
    return <div className={styles.dashboardWrapper}>
        <UserMenu/>
        <h1>Show Settings</h1>
        {mode}
        <button onClick={() => setEditMode(!isEditMode)}>
            {isEditMode ? 'CANCEL' : 'EDIT'}
        </button>
        <div className={styles.bottom}>
            <div className={styles.attendeesWrapper}>
                <AttendeesContainer/>
            </div>
            <RoomsContainer />
        </div>
    </div>

}

export default DashboardContainer;