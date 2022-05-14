import { useEffect, useRef, useState } from "react";
import { BiRefresh } from "react-icons/bi"
import EVENTS from "../config/events";
import styles_old from "../styles/Dashboard_old.module.css"
import styles from "../styles/Dashboard.module.css"
import { useSockets } from "../context/socket.context";
import RoomsContainer from "./Rooms";
import UserMenu from "./UserMenu";
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

const NavbarContainer = ({mode, setMode}) => {
    return <div className={styles.navbar}>
        {mode !== MODES.THEATRE && <button onClick={() => setMode(MODES.THEATRE)} className={styles.locationButton}><MdOutlineTheaters /></button>}
        {mode !== MODES.QNA && <button onClick={() => setMode(MODES.QNA)} className={styles.locationButton}><MdLiveHelp /></button>}
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

const ShowInfoContainer = (props) => {
    const [isEditMode, setEditMode] = useState(false);
    const {isViewerChatEnabled, setViewerChatEnabled} = useChatRooms();
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);
    const {show, socket, setNotif} = useSockets();

    const edit = () => setEditMode(true);

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
            <div className={classList(styles.refresh)}><BiRefresh/></div>
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
                <ToggleButton label="Chat" action={toggleAudienceChat} isSelected={isViewerChatEnabled}/>
                <ToggleButton action={() => console.log('e')} label="Voting" isSelected={false}/>
                <ToggleButton action={() => console.log('e')} label="Results" isSelected={false}/>
            </div>
        </div>
    </div>;
}

const DashboardContainer = () => {
    // this will encapsulate the Rooms, Messages, Poll, 
    // and EventInfo, including Time, Duration, Title
    const {socket, show, setNotif} = useSockets();
    const [isEditMode, setEditMode] = useState(false);
    const [mode, setMode] = useState(MODES.DASHBOARD);
    const newShowTitle = useRef(null);
    const newEventId = useRef(null);

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

    const showInfo = isEditMode ?
        <div className={styles_old.editShowInfo}>
            <input placeholder='Show Title' 
                ref={newShowTitle} 
                defaultValue={show.name}
            />
            <input placeholder='Event ID' 
                ref={newEventId}
                defaultValue={show.eventId}
            />
            <button onClick={handleUpdateShow}>UPDATE</button>
        </div> :
        <div className={styles_old.showInfo}>
            <p>Show Title: {show.name}</p>
            <p className={!show.attendees ? styles_old.error : styles_old.success}>Event ID: {show.eventId}</p>
            <button onClick={toggleShowStart}>{show.isOpen ? 'END' : 'START'}</button>
        </div>

    if (mode == MODES.THEATRE) {
        return <div className={styles_old.dashboardWrapper}>
            <UserMenu/>
            <button onClick={() => setMode(MODES.DASHBOARD)}>{MODES.DASHBOARD}</button>
            <button onClick={() => setMode(MODES.QNA)}>{MODES.QNA}</button>
            <ViewerContainer isAdmin={true} />
        </div>;
    }
    
    if (mode == MODES.QNA) {
        return <div className={styles_old.dashboardWrapper}>
            <UserMenu/>
            <button onClick={() => setMode(MODES.THEATRE)}>{MODES.THEATRE}</button>
            <button onClick={() => setMode(MODES.DASHBOARD)}>{MODES.DASHBOARD}</button>
            <QNAContainer />
        </div>;
    }

    if (mode === MODES.DASHBOARD) {
        return <div className={styles.dashboard}>
            <NavbarContainer mode={mode} setMode={setMode}/>
            <DateTimeContainer className={classList(styles.container, styles.row, styles.clock)} />
            <div className={styles.row}>
                <ShowInfoContainer className={classList(styles.container, styles.showInfo)}/>
                <PollSettingsContainer className={classList(styles.container, styles.poll)}/>
                <RoomsContainer className={classList(styles.container, styles.rooms)}/>
            </div>
            <div className={styles.row}>
                <AttendeesContainer className={classList(styles.container, styles.attendees)}/>
                <UsersContainer className={classList(styles.container, styles.users)}/>
            </div>
        </div>;
    }

    return <div className={styles_old.dashboardWrapper}>
        <UserMenu/>
        <button onClick={() => setMode(MODES.THEATRE)}>{MODES.THEATRE}</button>
        <button onClick={() => setMode(MODES.QNA)}>{MODES.QNA}</button>
        <h1>Show Settings</h1>
        {showInfo}
        <button onClick={() => setEditMode(!isEditMode)}>
            {isEditMode ? 'CANCEL' : 'EDIT'}
        </button>
        <div className={styles_old.bottom}>
            <div className={styles_old.attendeesWrapper}>
                <AttendeesContainer/>
                <UsersContainer/>
            </div>
            <div className={styles_old.roomsWrapper}>
                <RoomsContainer />
                <PollSettingsContainer/>
            </div>
        </div>
    </div>;
}

export default DashboardContainer;