import { useRouter } from "next/router";
import { useRef } from "react";
import { createNotif } from "../../containers/Snackbar";
import { useSockets } from "../../context/socket.context";
import { classList } from "../../utils/utils";
import styles from "../../styles/Login.module.css";
import themes from '../../styles/Themes.module.css'
import Link from "next/link";
import { LOGIN_ROUTES } from "./modes";


const ForgotPassword = () => {
  const {setNotif, createAccount} = useSockets();
  const router = useRouter();
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
            <h1>Forgot password?</h1>
            <input placeholder='Email' ref={emailRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton}>REQUEST</button>
                <Link href={LOGIN_ROUTES.REGISTER} shallow>
                    <button className={styles.otherButton}>Just purchased a ticket?</button>
                </Link>
                <Link href={LOGIN_ROUTES.LOGIN} shallow>
                    <button className={styles.otherButton}>Back</button>
                </Link>
            </div>
        </div>
    </div>;
}
export default ForgotPassword;