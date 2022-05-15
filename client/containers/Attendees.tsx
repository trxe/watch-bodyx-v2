import { useSockets } from "../context/socket.context";
import { HiOutlineTicket, HiStatusOffline } from "react-icons/hi"
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'
import { BsThreeDotsVertical } from "react-icons/bs";
import { classList } from "../utils/utils";
import { BiRefresh } from "react-icons/bi";
import { RiArrowDownSFill, RiArrowDownSLine } from "react-icons/ri";
import DropdownMenu from "../utils/dropdown";
import { useRef, useState } from "react";
import { User } from "./Clients";

const Attendee = ({name, ticket}) => {
    return <div className={classList(styles.attendee, styles.row)}>
        <div className={styles.icon}><HiStatusOffline/></div>
        <div className={styles.ticket}>{ticket}</div>
        <div className={styles.name}>{name}</div>
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
    </div>;
}

const AttendeesContainer = (props) => {
    const {show} = useSockets();
    const [filterKeyword, setFilterKeyword] = useState('')
    const filterRef = useRef(null);

    const contains = (user: User) => user.name.indexOf(filterKeyword) >= 0;

    const changeFilter = () => {
        if (filterRef.current && filterRef.current.value) 
            setFilterKeyword(filterRef.current.value);
        else setFilterKeyword('');
    }

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <HiOutlineTicket />
            <div className={dashboard.containerTitle}>TICKET HOLDERS</div>
            <div className={styles.search}>
                <input onChange={changeFilter} ref={filterRef} placeholder="Filter"/>
            </div>
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
                <DropdownMenu style={{opacity: 0, cursor: 'none'}} title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
            </div>
            {show.attendees && 
                Array.from(show.attendees.values())
                    .filter(contains)
                    .map(attendee => 
                        <Attendee key={attendee.ticket} 
                            name={attendee.name} 
                            ticket={attendee.ticket}
                            />)}
        </div>
    </div>
}

export default AttendeesContainer;