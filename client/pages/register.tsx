import Link from "next/link";
import { useRef } from "react";
import { createNotif } from "../containers/Snackbar";
import { useSockets } from "../context/socket.context";
import { classList } from "../utils/utils";
import styles from "../styles/Login.module.css";
import themes from '../styles/Themes.module.css'
import { ROUTES } from "../config/routes";

const Register = () => {
  const {setNotif, createAccount} = useSockets();
  const emailRef = useRef(null);
  const orderIdRef = useRef(null);

  const handleCreateAcct = () => {
    const email = emailRef.current.value;
    const orderId = orderIdRef.current.value;
    if (!email || !orderId || email.length == 0 || orderId.length == 0) {
      setNotif(createNotif('error', "Missing email or order ID", "Please enter all details."));
    } else {
      createAccount({email, orderId});
    }
  }
    return <div className={classList(styles.loginWrapper, themes.default)}>
        <div className={styles.loginDetails}>
            <h1>Register ticket</h1>
            <input placeholder='Email' ref={emailRef}/>
            <input placeholder='Order ID' ref={orderIdRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleCreateAcct}>REQUEST</button>
                <Link href={ROUTES.LOGIN} shallow>
                    <button className={styles.otherButton}>Already have an account?</button>
                </Link>
            </div>
        </div>
    </div>;
}
export default Register;