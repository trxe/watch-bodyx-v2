import { useRef, useState } from "react";
import EVENTS from "../config/events";
import styles from "../styles/Dashboard.module.css"
import { useSockets } from "../context/socket.context";
import RoomsContainer from "./Rooms";

const DashboardContainer = () => {
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    const {socket, show} = useSockets();
    const [isEditMode, setEditMode] = useState(false);
    const [attendees, setAttendees] = useState([]);
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);

    const handleUpdateShow = () => {
        if (newShowTitle.current.value == show.name &&
            newEventId.current.value == show.eventId) {
                setEditMode(false);
                return;
            }
        socket.emit(EVENTS.CLIENT.UPDATE_SHOW, {
            name: newShowTitle.current.value,
            eventId: newEventId.current.value,
            rooms: [],
        });
        setEditMode(false);
        // MUST wait for ack HERE: to be implemented.
    }

    socket.on(EVENTS.SERVER.CURRENT_SHOW, ({name, eventId, rooms}) => {
        console.log("update inside fashboard");
    });
    
    socket.on(EVENTS.SERVER.ATTENDEE_LIST, (value) => {
            console.log(socket.id, value);
            setAttendees(value); 
        })

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
        <h1>Show Settings</h1>
        {mode}
        <button onClick={() => setEditMode(!isEditMode)}>
            {isEditMode ? 'CANCEL' : 'EDIT'}
        </button>
        <div className={styles.bottom}>
            <div className={styles.attendeesWrapper}>
                <h2>Attendees</h2>
                <ul>
                    {attendees.map((element) => {
                        return <li key={element.ticket}>{element.profile.name}</li>
                    })}
                </ul>
            </div>
            <RoomsContainer />
        </div>
    </div>

}

export default DashboardContainer;