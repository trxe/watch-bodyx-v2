import { useSockets } from "../context/socket.context";
import { HiOutlineTicket, HiStatusOffline, HiStatusOnline } from "react-icons/hi"
import dashboard from '../styles/Dashboard.module.css'
import styles from '../styles/Attendees.module.css'
import { BsThreeDotsVertical } from "react-icons/bs";
import { classList } from "../utils/utils";
import { RiArrowDownSFill, RiArrowDownSLine, RiUserFill, RiUserStarFill } from "react-icons/ri";
import DropdownMenu from "../utils/dropdown";
import { FC, useEffect, useRef, useState } from "react";
import { User } from "./Clients";

interface IAttendee {
    user: User
    refObj?
    refDiv?
}

const Attendee:FC<IAttendee> = ({user, refObj, refDiv}) => {
    useEffect(() => {
        if (refObj && refObj.current) console.log('ref');
        refObj?.current?.scrollIntoView({ behavior: "smooth" });
    }, [refObj, refDiv])

    return <div className={classList(styles.attendee, styles.row, 
            user.isPresent ? styles.present : (user.ticket === '' ? styles.uncreated : styles.absent))}>
        <div className={styles.icon}>{user.isPresent ? <HiStatusOnline/> : <HiStatusOffline/>}</div>
        <div className={styles.ticket}>{user.ticket}</div>
        <div className={styles.name}>{user.name}</div>
        <div className={styles.email}>{user.email}</div>
        {refDiv}
        <DropdownMenu title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
    </div>;
}

const AttendeesContainer = (props) => {
    const {show, selectedClient} = useSockets();
    const [filterKeyword, setFilterKeyword] = useState('');
    const [isAdminFilter, setAdminFilter] = useState(false);
    const focusUserRef = useRef(null);
    const filterRef = useRef(null);

    useEffect(() => {
        console.log(selectedClient);
    }, [selectedClient])

    const containsKeyword = (user: User) => {
        return (user.name.toLowerCase().indexOf(filterKeyword) >= 0 
            || user.email.toLowerCase().indexOf(filterKeyword) >= 0 
            || user.ticket.indexOf(filterKeyword) >= 0)
            && isAdminFilter === user.isAdmin;
    }

    const changeUserType = () => setAdminFilter(!isAdminFilter);

    const changeFilter = () => {
        if (filterRef.current && filterRef.current.value) 
            setFilterKeyword(filterRef.current.value);
        else setFilterKeyword('');
    }

    const refDiv = <div ref={focusUserRef}></div>;

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
                <div className={styles.email}>Email
                    <button><RiArrowDownSLine/></button>
                </div>
                <DropdownMenu style={{opacity: 0, cursor: 'none'}} title={<BsThreeDotsVertical/>} labels={[]} actions={[]}/>
            </div>
            {!selectedClient && refDiv}
            {show.attendees && 
                Array.from(show.attendees.values())
                    .filter(containsKeyword)
                    .map(attendee => 
                        <Attendee key={attendee.email} 
                            user={attendee}
                            refObj={selectedClient != null && selectedClient.user.ticket === attendee.ticket ? focusUserRef : null}
                            refDiv={selectedClient != null && selectedClient.user.ticket === attendee.ticket ? refDiv : null}
                            />)}
        </div>
    </div>
}

export default AttendeesContainer;