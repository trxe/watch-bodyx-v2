import { useSockets } from "../context/socket.context";
import dashboardStyles from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'

const Attendee = ({name, ticket}) => {
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
                Array.from(show.attendees.values())
                    .map(attendee => 
                        <Attendee key={attendee.ticket} 
                            name={attendee.name} 
                            ticket={attendee.ticket}
                            />)}
        </div>
    </div>
}

export default AttendeesContainer;