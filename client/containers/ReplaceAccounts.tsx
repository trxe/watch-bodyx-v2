import { useEffect, useRef } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";


const ReplaceAccountsContainer = () => {
    const {setNotif, user} = useSockets();
    let refs = [];

    useEffect(() => {
        if (!user.copies) refs = [];
        else refs = Array[user.copies].map(() => useRef(null));
    }, [user])

    const handleReplaceAccounts = () => {
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Set password</h1>
            {refs.map((ref, idx) => {
                <input key={idx} placeholder='Email' ref={ref}  type="password"/>
            })}
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleReplaceAccounts}>CHANGE</button>
            </div>
        </div>
    </div>;
}

export default ReplaceAccountsContainer;