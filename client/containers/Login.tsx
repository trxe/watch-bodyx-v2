import { useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import { createNotif } from "./Snackbar";
import styles from "../styles/Login.module.css";

const MODES = {
    LOGIN: 0,
    CREATE_ACCT: 1,
    FORGOT_PWD: 2,
};

const LoginContainer = () => {
  const {setNotif, loginRequest, createAccount} = useSockets();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const eventIdRef = useRef(null);
  const [mode, setMode] = useState(MODES.LOGIN);

  const goToLogin = () => setMode(MODES.LOGIN);
  const goToCreateAcct = () => setMode(MODES.CREATE_ACCT);
  const goToForgotPwd = () => setMode(MODES.FORGOT_PWD);

  const handleSetTicket = () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    if (!email || !password || email.length == 0 || password.length == 0) {
      setNotif(createNotif('error', "Missing email or password", "Please enter all details."));
    } else {
      loginRequest({email, password});
    }
  }

  const handleCreateAcct = () => {
    const email = emailRef.current.value;
    const eventId = eventIdRef.current.value;
    if (!email || !eventId || email.length == 0 || eventId.length == 0) {
      setNotif(createNotif('error', "Missing email or event ID", "Please enter all details."));
    } else {
      createAccount({email, eventId});
    }
  }

    return <div className={styles.loginWrapper}>
        {mode == MODES.LOGIN && <div className={styles.loginDetails}>
            <h1>BODYX</h1>
            <input placeholder='Email' ref={emailRef}/>
            <input placeholder='Password' ref={passwordRef} type='password'/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleSetTicket}>LOGIN</button>
                <button className={styles.otherButton} onClick={goToCreateAcct}>Just purchased a ticket?</button>
                <button className={styles.otherButton} onClick={goToForgotPwd}>Forgot password?</button>
            </div>
        </div>}
        {mode == MODES.CREATE_ACCT && <div className={styles.loginDetails}>
            <h1>Create account</h1>
            <input placeholder='Email' ref={emailRef}/>
            <input placeholder='Event ID' ref={eventIdRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleCreateAcct}>REQUEST</button>
                <button className={styles.otherButton} onClick={goToLogin}>Already have an account?</button>
            </div>
        </div>}
        {mode == MODES.FORGOT_PWD && <div className={styles.loginDetails}>
            <h1>Forgot password?</h1>
            <input placeholder='Email' ref={emailRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton}>REQUEST</button>
                <button className={styles.otherButton} onClick={goToCreateAcct}>Just purchased a ticket?</button>
                <button className={styles.otherButton} onClick={goToLogin}>Back</button>
            </div>
        </div>}
    </div>;
}

export default LoginContainer;