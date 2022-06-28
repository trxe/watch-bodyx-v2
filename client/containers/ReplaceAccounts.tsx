import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";


const ReplaceAccountsContainer = () => {
  const {user, createAccount} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const [replacements, setReplacements] = useState([]);
  const router = useRouter();

    useEffect(() => {
        if (!user || !user.replacementTickets) setReplacements([]);
        else setReplacements(user.replacementTickets.map(ticket => {
            return {email: '', ticket};
        }));
    }, [user])

    const handleEditEmails = (idx: number, email: string) => {
        let newReps = [...replacements];
        newReps[idx] = {...newReps[idx], email};
        setReplacements(newReps);
    }

    const handleCreateAccount = () => {
        const newEventId = user.eventIds[user.eventIds.length - 1];
        setRegistering(true);
        createAccount({replacements, newEventId}, (dst) => {
            setRegistering(false)
            if (dst) router.push(dst);
        });
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Invite attendees</h1>
            <div style={{textAlign: 'center', padding: '1.5em'}}>
                You have {replacements.length + 1} accounts under your email in your order. Send invites to {replacements.length} other people!
            </div>
            {replacements.map((replacement, idx) => {
                return <input key={replacement.ticket} placeholder={`Email ${idx}`}
                    onChange={event => handleEditEmails(idx, event.target.value)}/>
            })}
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleCreateAccount} disabled={isRegistering}>SEND</button>
            </div>
        </div>
    </div>;
}

export default ReplaceAccountsContainer;