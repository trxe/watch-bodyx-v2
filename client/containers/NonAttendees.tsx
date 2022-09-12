import { useEffect, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/NonAttendees.module.css";


const NonAttendeesContainer = () => {
    const {user, loadStartTime, setNotif} = useSockets();
    const [timeString, setTimeString] = useState('___');
    // Load time
    useEffect(() => {
        if (user.eventIds.length == 0) return;
        const request = {
            eventId: user.eventIds[user.eventIds.length - 1]
        }
        loadStartTime(request, (ack) => {
            if (ack.messageType == 'info') {
                const startTime = JSON.parse(ack.message);
                setTimeString(startTime.local);
            } else {
                setNotif(ack);
            }
        });
    }, [user]);

    return <div className={styles.nonAttendees}>
        <h1>Your show will commence in ___ hours.</h1>
        <h1>At time {timeString}.</h1>
        <p>Please refresh the page and login again 15 minutes before show. Thank you!</p>
    </div>;
}

export default NonAttendeesContainer;