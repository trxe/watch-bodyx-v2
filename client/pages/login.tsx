import Link from "next/link";
import { useRef } from "react";
import Snackbar, { createNotif } from "../containers/Snackbar";
import { useSockets } from "../context/socket.context";
import themes from '../styles/Themes.module.css'
import styles from "../styles/Login.module.css";
import { classList } from "../utils/utils";
import { ROUTES } from "../config/routes";

const Login = () => {
  const {notif, setNotif, loginRequest} = useSockets();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSetTicket = () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    if (!email || !password || email.length == 0 || password.length == 0) {
      setNotif(createNotif('error', "Missing email or password", "Please enter all details."));
    } else {
      loginRequest({email, password});
    }
  }

    return <div className={classList(styles.loginWrapper, themes.default)}>
        <div className={styles.loginDetails}>
            <h1>BODYX</h1>
            <input placeholder='Email' ref={emailRef}/>
            <input placeholder='Password' ref={passwordRef} type='password'/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleSetTicket}>LOGIN</button>
                <Link href={ROUTES.REGISTER} shallow>
                    <button className={styles.otherButton}>Just purchased a ticket?</button>
                </Link>
                <Link href={ROUTES.FORGOT_PWD} shallow>
                    <button className={styles.otherButton}>Forgot password?</button>
                </Link>
            </div>
        </div>
        {notif != null &&
            <Snackbar timer={4000} 
            messageType={notif.messageType}
            title={notif.title}
            message={notif.message}
            />}
    </div>;
}

export default Login;