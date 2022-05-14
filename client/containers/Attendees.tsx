import { useSockets } from "../context/socket.context";
import { HiOutlineTicket, HiStatusOffline } from "react-icons/hi"
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'
import { BsThreeDotsVertical } from "react-icons/bs";
import { classList } from "../utils/utils";
import { BiRefresh } from "react-icons/bi";
import { RiArrowDownSFill, RiArrowDownSLine } from "react-icons/ri";

const Attendee = ({name, ticket}) => {
    return <div className={classList(styles.attendee, styles.row)}>
        <div className={styles.icon}><HiStatusOffline/></div>
        <div className={styles.ticket}>{ticket}</div>
        <div className={styles.name}>{name}</div>
        <button className={styles.icon}><BsThreeDotsVertical/></button>
    </div>;
}

const AttendeesContainer = (props) => {
    const {show} = useSockets();

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <HiOutlineTicket />
            <div className={dashboard.containerTitle}>TICKET HOLDERS</div>
            <div className={classList(dashboard.refresh)}><BiRefresh/></div>
        </div>
        <div className={dashboard.containerContent}>
            <div className={classList(styles.attendee, styles.header)}>
                <div className={styles.icon}></div>
                <div className={styles.ticket}>Ticket 
                    <button><RiArrowDownSFill/></button>
                </div>
                <div className={styles.name}>Name
                    <button><RiArrowDownSLine/></button>
                </div>
            </div>
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