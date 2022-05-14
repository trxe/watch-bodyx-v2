import { useSockets } from "../context/socket.context";
import { HiOutlineTicket } from "react-icons/hi"
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'

const Attendee = ({name, ticket}) => {
    return <div key={ticket} className={styles.attendee}>
        <p>{name}</p>
        <p>{ticket}</p>
    </div>;
}

const AttendeesContainer = (props) => {
    const {show} = useSockets();

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <HiOutlineTicket />
            <div className={dashboard.containerTitle}>TICKET HOLDERS</div>
        </div>
        <div className={dashboard.containerContent}>
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