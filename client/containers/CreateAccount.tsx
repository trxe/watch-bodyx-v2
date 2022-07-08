import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { CLIENT_ROUTES } from "../config/routes";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";
import { createNotif } from "./Snackbar";

const PAGES = { 
    PASSWORD: 1,
    REPLACE_ACCTS: 2
}

const MAX_REPLACEMENTS = 10;

const CreateAccountContainer = () => {
  const {setNotif, user, createAccount} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const [page, setPage] = useState(PAGES.PASSWORD);
  const [replacements, setReplacements] = useState([]);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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

    const handlePasswordSet = event => {
        setPassword(event.target.value);
    }

    const handlePasswordConfirmSet = event => {
        setPasswordConfirm(event.target.value);
    }

    const nextPage = () => {
        if (password !== passwordConfirm) {
            setNotif(createNotif('error', 'Passwords do not match.', 'Enter the same password in both fields.'));
            return;
        } else {
            setPage(PAGES.REPLACE_ACCTS);
        }
    }

    const handleCreateAccount = () => {
        if (password !== passwordConfirm) {
            setNotif(createNotif('error', 'Passwords do not match.', 'Enter the same password in both fields.'));
            return;
        }
        const newEventId = user.eventIds[user.eventIds.length - 1];
        setRegistering(true);
        createAccount({user, password, replacements, newEventId}, (dst) => {
            setRegistering(false)
            if (dst) router.push(dst);
        });
    }

    if (replacements && replacements.length > MAX_REPLACEMENTS) {
        return <div className={styles.loginWrapper}>
            <div className={styles.loginDetails}>
                <h1>Too many tickets detected</h1>
                <div style={{textAlign: 'center', padding: '1.5em'}}>
                    Please email <a href="mailto:ticketing@bodyx.net">ticketing@bodyx.net</a> to create accounts.
                </div>
                <div className={styles.buttons}>
                    <button className={styles.otherButton} onClick={() => router.push(CLIENT_ROUTES.LOGIN)}>Return to login</button>
                </div>
            </div>
        </div>;
    } else if (page == PAGES.PASSWORD) {
        return <div className={styles.loginWrapper}>
            <div className={styles.loginDetails}>
                <h1>Set a password</h1>
                <input placeholder='Password' onChange={handlePasswordSet}  type="password"/>
                <input placeholder='Confirm password' onChange={handlePasswordConfirmSet} type="password"/>
                <div className={styles.buttons}>
                    <button className={styles.loginButton} 
                        onClick={replacements.length == 0 ? handleCreateAccount : nextPage} 
                        disabled={isRegistering}>{replacements.length == 0 ? 'CREATE': 'NEXT'}</button>
                </div>
            </div>
        </div>;
    } else if (page == PAGES.REPLACE_ACCTS) {
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
}

export default CreateAccountContainer;