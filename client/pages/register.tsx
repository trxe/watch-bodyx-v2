import Link from "next/link";
import { useRef, useState } from "react";
import Snackbar, { createNotif } from "../containers/Snackbar";
import { useSockets } from "../context/socket.context";
import { classList } from "../utils/utils";
import styles from "../styles/Login.module.css";
import { CLIENT_ROUTES } from "../config/routes";
import { CHANNELS } from "../config/channels";
import VerifyContainer from "../containers/Verify";
import CreateAccountContainer from "../containers/CreateAccount";
import { useRouter } from "next/router";
import ReplaceAccountsContainer from "../containers/ReplaceAccounts";
import SetPasswordContainer from "../containers/ChangePassword";
import { themeName } from "../config/global_settings";

const Register = () => {
  const {channel, notif, setNotif, register} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const emailRef = useRef(null);
  const orderIdRef = useRef(null);
  const router = useRouter();

  const handleCreateAcct = () => {
    const email = emailRef.current.value.toLowerCase();
    const orderId = orderIdRef.current.value;
    if (!email || !orderId || email.length == 0 || orderId.length == 0) {
        setNotif(createNotif('error', "Missing email or order ID", "Please enter all details."));
    } else {
        setRegistering(true);
        register({email, orderId}, (dst) => {
            setRegistering(false);
            if (dst) router.push(dst);
        });
    }
  }

  return <div className={classList(styles.loginWrapper, themeName)}>
    <div className='splash-image'/>
    {channel === CHANNELS.CREATE_ACCOUNT && <CreateAccountContainer />}
    {channel === CHANNELS.REPLACE_ACCOUNTS && <ReplaceAccountsContainer />}
    {channel === CHANNELS.CHANGE_PASSWORD && <SetPasswordContainer />}
    {channel === CHANNELS.VERIFY && <VerifyContainer />}
    {(!channel || channel === CHANNELS.LOGIN_ROOM) && 
        <div className={styles.loginDetails}>
            <h1>Register ticket</h1>
            <input placeholder='Email' ref={emailRef}/>
            <input placeholder='Order ID' ref={orderIdRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleCreateAcct} disabled={isRegistering}>REQUEST</button>
                <Link href={CLIENT_ROUTES.LOGIN} passHref shallow>
                    <button className={styles.otherButton}>Already have an account?</button>
                </Link>
            </div>
        </div>}
    {notif != null &&
        <Snackbar timer={4000} 
        messageType={notif.messageType}
        title={notif.title}
        message={notif.message}
        />}
    </div>;
}
export default Register;