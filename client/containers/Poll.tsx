import styles from "../styles/Poll.module.css"

const PollSettingsContainer = () => {
    return <div className={styles.pollWrapper}>
        <div className={styles.pollHeader}>
            <h3>Poll</h3>
            <button>Edit</button>
        </div>
        <div className={styles.pollSettings}>
            <textarea className={styles.field} placeholder="Title" rows={1}></textarea>
            <textarea className={styles.field} placeholder="Option" rows={1}></textarea>
        </div>
    </div>;

}

export default PollSettingsContainer;