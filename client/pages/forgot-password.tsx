import { useRef } from "react";
import { classList } from "../utils/utils";
import styles from "../styles/Login.module.css";
import themes from '../styles/Themes.module.css'
import Link from "next/link";
import { CLIENT_ROUTES } from "../config/routes";
import { themeName } from "../config/global_settings";


const ForgotPassword = () => {
  const emailRef = useRef(null);

    return <div className={classList(styles.loginWrapper, themeName)}>
        <div className={styles.loginDetails}>
            <h1>Forgot password?</h1>
            <input placeholder='Email' ref={emailRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton}>REQUEST</button>
                <Link href={CLIENT_ROUTES.REGISTER} passHref shallow>
                    <button className={styles.otherButton}>Just purchased a ticket?</button>
                </Link>
                <Link href={CLIENT_ROUTES.LOGIN} passHref shallow>
                    <button className={styles.otherButton}>Back</button>
                </Link>
            </div>
        </div>
    </div>;
}
export default ForgotPassword;