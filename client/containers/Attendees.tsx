import { FC, useRef, useState } from "react";
import { GrAdd } from 'react-icons/gr'
import { AiFillLock, AiFillUnlock } from "react-icons/ai";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import dashboardStyles from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'

export interface IAttendee {
    ticket: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    addresses?: {};
}

const Attendee:FC<IAttendee> = ({name, ticket}) => {
    return <div key={ticket} className={styles.attendee}>
        <p>{name}</p>
        <p>{ticket}</p>
    </div>;
}

const AttendeesContainer = () => {
    const {show} = useSockets();

    return <div className={dashboardStyles.attendeesWrapper}>
        <div className={styles.attendeeHeader}>
            <h2>Attendees</h2>
        </div>
        <div>
            {show.attendees && 
                show.attendees.map((attendee) => 
                    <Attendee name={attendee.name} ticket={attendee.ticket}/>) }
        </div>
    </div>
}

export default AttendeesContainer;