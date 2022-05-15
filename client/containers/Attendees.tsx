import { useSockets } from "../context/socket.context";
import { HiOutlineTicket, HiStatusOffline, HiStatusOnline } from "react-icons/hi"
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'
import { BsThreeDotsVertical } from "react-icons/bs";
import { classList } from "../utils/utils";
import { BiRefresh } from "react-icons/bi";
import { RiArrowDownSFill, RiArrowDownSLine, RiUserFill, RiUserStarFill } from "react-icons/ri";
import DropdownMenu from "../utils/dropdown";
import { FC, useRef, useState } from "react";
import { User } from "./Clients";

interface IAttendee {
    user: User
}

const Attendee:FC<IAttendee> = ({user}) => {
    return <div className={classList(styles.attendee, styles.row, user.isPresent ? styles.present : styles.absent)}>
        <div className={styles.icon}>{user.isPresent ? <HiStatusOnline/> : <HiStatusOffline/>}</div>
        <div className={styles.ticket}>{user.ticket}</div>
        <div className={styles.name}>{user.name}</div>
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
    </div>;
}

const AttendeesContainer = (props) => {
    const {show} = useSockets();
    const [filterKeyword, setFilterKeyword] = useState('');
    const [isAdminFilter, setAdminFilter] = useState(false);
    const filterRef = useRef(null);

    const containsKeyword = (user: User) => {
        return (user.name.indexOf(filterKeyword) >= 0 
            || user.ticket.indexOf(filterKeyword) >= 0)
            && isAdminFilter === user.isAdmin;
    }

    const changeUserType = () => setAdminFilter(!isAdminFilter);

    const changeFilter = () => {
        if (filterRef.current && filterRef.current.value) 
            setFilterKeyword(filterRef.current.value);
        else setFilterKeyword('');
    }

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <HiOutlineTicket />
            <div className={dashboard.containerTitle}>{isAdminFilter ? 'ADMINS' : 'TICKET HOLDERS'}</div>
            <div className={styles.search}>
                <input onChange={changeFilter} ref={filterRef} placeholder="Filter"/>
            </div>
            <div className={classList(styles.toggleView)} onClick={changeUserType}>
                {isAdminFilter ? <RiUserStarFill/> : <RiUserFill/>}</div>
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
                    .filter(containsKeyword)
                    .map(attendee => 
                        <Attendee key={attendee.ticket} 
                            user={attendee}
                            />)}
        </div>
    </div>
}

export default AttendeesContainer;