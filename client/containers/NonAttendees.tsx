import { useEffect, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/NonAttendees.module.css";
import { dateFormat, getTimeTo, timeFormat } from "../utils/utils";


const NonAttendeesContainer = () => {
    const {user, loadStartTime, setNotif} = useSockets();
    const [time, setTime] = useState(null);
    const [timeleft, setTimeLeft] = useState(null);
    const [utcString, setUtcString] = useState(null);
    // Load time
    useEffect(() => {
        if (user.eventIds.length == 0) return;
        const request = {
            eventId: user.eventIds[user.eventIds.length - 1]
        }
        loadStartTime(request, (ack) => {
            if (ack.messageType == 'info') {
                const startTime = JSON.parse(ack.message);
                setTime(`${dateFormat(startTime.local), timeFormat(startTime.local)}`);
                setUtcString(startTime.local);
            } else {
                setNotif(ack);
            }
        });
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(getTimeTo(utcString));
            setTime(`${dateFormat(utcString)}, ${timeFormat(utcString)}`);
        }, 1000);
    });

    return <div className={styles.nonAttendees}>
        <div className={styles.nonAttendeesWrapper}>
            <h1>{timeleft} left.</h1>
            <h1>On {time}.</h1>
            <p>Please refresh the page and login again 15 minutes before show. Thank you!</p>
        </div>
    </div>;
}

export default NonAttendeesContainer;