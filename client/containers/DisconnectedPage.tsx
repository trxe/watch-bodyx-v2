import styles from "../styles/DisconnectedPage.module.css"

const DisconnectedContainer = () => {
    return <div className={styles.disconnectedWrapper}>
        <h1>You have been kicked from the server.</h1>
        <p>Please contact the administrator for any inquiries.</p>
    </div>
}

export default DisconnectedContainer