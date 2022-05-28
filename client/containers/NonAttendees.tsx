import styles from "../styles/NonAttendees.module.css";


const NonAttendeesContainer = () => {
    return <div className={styles.nonAttendees}>
        <h1>Your show will commence in ___ hours.</h1>
        <h1>At time ____.</h1>
        <p>Please refresh the page and login again 15 minutes before show. Thank you!</p>
    </div>;
}

export default NonAttendeesContainer;