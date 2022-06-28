import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";


const ReplaceAccountsContainer = () => {
  const {user, createAccount} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const router = useRouter();
  let refs = [];

    useEffect(() => {
        if (!user || !user.replacementTickets) refs = [];
        else refs = user.replacementTickets.map(() => useRef(null));
    }, [user])


    const handleCreateAccounts = () => {
        const newEventId = user.eventIds[user.eventIds.length];
        const replacements = refs.map((ref, idx) => {
            return {
                email: ref.current.value, 
                ticket: user.replacementTickets[idx],
            };
        });
        setRegistering(true);
        createAccount({replacements, newEventId}, (dst) => {
            setRegistering(false)
            console.log('create account dst', dst);
            if (dst) router.push(dst);
        });
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Set password</h1>
            {refs.map((ref, idx) => {
                <input key={idx} placeholder='Email' ref={ref}  type="password"/>
            })}
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleCreateAccounts} disabled={isRegistering}>CHANGE</button>
            </div>
        </div>
    </div>;
}

export default ReplaceAccountsContainer;