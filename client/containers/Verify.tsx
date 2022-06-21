import { useRef } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";
import { createNotif } from "./Snackbar";


const VerifyContainer = () => {
  const {setNotif, user} = useSockets();
  const codeRef = useRef(null);

  const handleVerify = () => {
      const code = codeRef.current.value;
      if (!code) {
          setNotif(createNotif('error', 'Empty verification code', 'Enter the 6-digit verification code.'));
          return;
      }
      // TODO: Verify action
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Verify</h1>
            <p>The code has been sent to your email.</p>
            <input placeholder="Verification Code" ref={codeRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleVerify}>CHANGE</button>
            </div>
        </div>
    </div>;
}

export default VerifyContainer;