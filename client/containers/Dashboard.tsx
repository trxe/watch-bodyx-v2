import { useEffect, useRef, useState } from "react";
import { BiRefresh } from "react-icons/bi"
import EVENTS from "../config/events";
import styles from "../styles/Dashboard.module.css"
import { useSockets } from "../context/socket.context";
import RoomsContainer from "./Rooms";
import UsersContainer from "./Clients";
import AttendeesContainer from "./Attendees";
import { CHANNELS } from "../config/channels";
import ViewerContainer from "./Viewer";
import { MODES } from "../config/modes";
import QNAContainer from "./QnA";
import PollSettingsContainer from "./Poll";
import { classList, dayOfWeek, months } from "../utils/utils";
import { AiOutlineMenu } from "react-icons/ai";
import { MdLiveHelp, MdOutlineTheaterComedy, MdOutlineTheaters, MdSpaceDashboard } from "react-icons/md";
import ToggleButton from "../utils/toggleButton";
import { useChatRooms } from "../context/chats.context";
import { NOTIF } from "../config/notifications";
import { usePoll } from "../context/poll.context";

const NavbarContainer = ({mode, setMode}) => {
    const {unreadCounts} = useChatRooms();
    return <div className={styles.navbar}>
        {mode !== MODES.THEATRE && 
            <button onClick={() => setMode(MODES.THEATRE)} className={styles.locationButton}>
                <MdOutlineTheaters />{unreadCounts[MODES.THEATRE] > 0 && <span className={styles.badge}>{unreadCounts[MODES.THEATRE]}</span>}
            </button>}
        {mode !== MODES.QNA && 
            <button onClick={() => setMode(MODES.QNA)} className={styles.locationButton}>
                <MdLiveHelp />{unreadCounts[MODES.QNA] > 0 && <span className={styles.badge}>{unreadCounts[MODES.QNA]}</span>}
            </button>}
        {mode !== MODES.DASHBOARD && <button onClick={() => setMode(MODES.DASHBOARD)} className={styles.locationButton}><MdSpaceDashboard /></button>}
        <button className={styles.otherButton}><AiOutlineMenu /></button>
    </div>;
}

const DateTimeContainer = (props) => {
    const calcTime = () => {
        const today = new Date();
        const h = today.getHours();
        const m = today.getMinutes().toString().padStart(2, '0');
        const s = today.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    const calcDate = () => {
        const today = new Date();
        const day = dayOfWeek[today.getDay()];
        const date = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        return `${day}, ${date} ${month} ${year}`;
    }

    const [time, setTime] = useState(calcTime());
    const [date, setDate] = useState(calcDate());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTime(calcTime());
            setDate(calcDate());
        }, 1000);
    })

    return <div {...props}>
        <div className={styles.time}>{time}</div>
        <div className={styles.date}>{date}</div>
    </div>;
}

const EventInfoContainer = (props) => {
    const {show, viewersPresent, viewersTotal} = useSockets();

    return <div {...props} style={{opacity: !show || show.attendees.size == 0 ? "0%" : "100%"}}>
        <div style={{fontSize: "larger", fontWeight: "900"}}>
            {viewersPresent} of {viewersTotal}
        </div>
        <div>attendees present</div>
    </div>
}

const ShowInfoContainer = (props) => {
    const {activeStatus, poll, setPoll, question, isResults, isEditPoll, setEditPoll, currentVotes} = usePoll();
    const [isEditMode, setEditMode] = useState(false);
    const {isViewerChatEnabled, setViewerChatEnabled} = useChatRooms();
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);
    const {show, socket, setNotif} = useSockets();

    const edit = () => setEditMode(true);

    const requestShow = () => {
        socket.emit(EVENTS.CLIENT.GET_INFO, {request: 'show'});
    }

    const cancelUpdate = () => {
        newShowTitle.current.value = !show || !show.name ? '' : show.name;
        newEventId.current.value = !show || !show.eventId ? '' : show.eventId;
        setEditMode(false);
    }

    const handleUpdateShow = () => {
        if (newShowTitle.current.value == show.name &&
            newEventId.current.value == show.eventId) {
                setEditMode(false);
                return;
            }
        setNotif({messageType: 'warning', title: 'Loading event info...', 
            message: 'Loading event from server.'})
        socket.emit(EVENTS.CLIENT.UPDATE_SHOW, {
            name: newShowTitle.current.value,
            eventId: newEventId.current.value,
        }, (res) => {
            setNotif(res);
        });
        setEditMode(false);
    }

    const toggleShowStart = () => {
        console.log('Toggle show start', !show.isOpen);
        socket.emit(EVENTS.CLIENT.TOGGLE_SHOW_START, {
            fromChannel: !show.isOpen ? CHANNELS.WAITING_ROOM : CHANNELS.MAIN_ROOM,
            toChannel: !show.isOpen ? CHANNELS.MAIN_ROOM : CHANNELS.WAITING_ROOM,
            isShowOpen: !show.isOpen
        }, (res) => {
            setNotif(res);
        });
    }

    const toggleAudienceChat = (toggleRef) => {
        if (!socket || socket.disconnected) {
            toggleRef.current.checked = isViewerChatEnabled;
            setNotif(NOTIF.DISCONNECTED);
            return;
        }
        socket.emit(EVENTS.CLIENT.ADMIN_TOGGLE_AUDIENCE_CHAT, 
            {status: isViewerChatEnabled},
            (res) => setViewerChatEnabled(res.status));
    }

    const toggleAudienceVoting = (toggleRef) => {
        if (!socket || socket.disconnected) {
            toggleRef.current.checked = activeStatus;
            setNotif(NOTIF.DISCONNECTED);
            return;
        }
        const newActiveStatus = !activeStatus;
        // to prevent accidental updates
        setEditPoll(true);
        socket.emit(EVENTS.CLIENT.ADMIN_TOGGLE_POLL_STATUS, {isActive: newActiveStatus}, 
            (res) => {
                setEditPoll(false);
                if (res && res.messageType === 'error') {
                    setNotif(res);
                } else {
                    toggleRef.current.checked = newActiveStatus;
                }
            });
    }

    const publishPoll = (toggleRef) => {
        if (!socket || socket.disconnected) {
            toggleRef.current.checked = activeStatus;
            setNotif(NOTIF.DISCONNECTED);
            return;
        }
        const newPublishStatus = !isResults;
        socket.emit(EVENTS.CLIENT.ADMIN_PUBLISH_POLL_RESULTS, {isResults: newPublishStatus}, (res) => {
            setNotif(res);
            if (res && res.messageType === 'success') {
                poll.isResults = true;
                setPoll(poll);
            } else {
                toggleRef.current.checked = newPublishStatus;
            }
        });
    }

    return <div {...props}>
        <div className={styles.containerHeader}> 
            <MdOutlineTheaterComedy/>
            <div className={styles.containerTitle}>SHOW</div>
            <button onClick={isEditMode ? handleUpdateShow : toggleShowStart}>
                {isEditMode ? 'Update' : show && show.isOpen ? 'Stop' : 'Start'}
            </button>
            <button onClick={isEditMode ? cancelUpdate : edit}>
                {isEditMode ? 'Cancel' : 'Edit'}
            </button>
            <div className={classList(styles.refresh)} onClick={requestShow}><BiRefresh/></div>
        </div>
        <div className={styles.containerContent}>
            <div className={styles.field}>
                <label>Show Title</label>
                <input placeholder='Title' 
                    disabled={!isEditMode}
                    ref={newShowTitle} 
                    defaultValue={show.name}
                />
            </div>
            <div className={styles.field}>
                <label>Event ID</label>
                <input placeholder='Event ID' 
                    disabled={!isEditMode}
                    ref={newEventId} 
                    defaultValue={show.eventId}
                />
            </div>
            <div className={styles.row}>
                <ToggleButton label="Chat" action={toggleAudienceChat} isSelected={isViewerChatEnabled} disabled={false}/>
                <ToggleButton label="Voting" action={toggleAudienceVoting} isSelected={activeStatus} disabled={isEditPoll || !question}/>
                <ToggleButton label="Results" action={publishPoll} isSelected={isResults} disabled={isEditPoll || !question || currentVotes == 0}/>
            </div>
        </div>
    </div>;
}

const DashboardContainer = () => {
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    const [mode, setMode] = useState(MODES.DASHBOARD);

    if (mode == MODES.THEATRE) {
        return <div className={styles.dashboard}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <ViewerContainer isAdmin={true} />
        </div>;
    }
    
    if (mode == MODES.QNA) {
        return <div className={styles.dashboard}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <QNAContainer />
        </div>;
    }

    if (mode === MODES.DASHBOARD) {
        return <div className={styles.dashboard}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <div className={classList(styles.container, styles.row)}>
                <DateTimeContainer className={styles.clock} />
                <EventInfoContainer className={styles.eventInfo} />
            </div>
            <div className={styles.row}>
                <ShowInfoContainer className={classList(styles.container, styles.showInfo)}/>
                <PollSettingsContainer className={classList(styles.container, styles.poll)}/>
                <RoomsContainer className={classList(styles.container, styles.rooms)}/>
            </div>
            <div className={styles.row}>
                <UsersContainer className={classList(styles.container, styles.users)}/>
                <AttendeesContainer className={classList(styles.container, styles.attendees)}/>
            </div>
        </div>;
    }

    return null;
}

export default DashboardContainer;