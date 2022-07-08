import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";
import { createNotif } from "./Snackbar";


const VerifyContainer = () => {
  const {setNotif, user, verify, regenVerify} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const codeRef = useRef(null);
  const router = useRouter();

    const handleVerify = () => {
      const code = codeRef.current.value;
      if (!code) {
          setNotif(createNotif('error', 'Empty verification code', 'Enter the 6-digit verification code.'));
          return;
    } else {
        setRegistering(true);
        verify({email: user.email, code}, (dst) => {
            setRegistering(false);
            if (dst) router.push(dst);
        });
      }
    }

    const generateNewCode = () => {
        setRegistering(true);
        regenVerify({email: user.email}, () => setRegistering(false));
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Verify</h1>
            <div style={{textAlign: 'center', padding: '1.5em'}}>
                Please check your inbox and your spam folder for the verification code, which will be sent shortly.
            </div>
            <input placeholder="Verification Code" ref={codeRef}/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleVerify} disabled={isRegistering}>CHANGE</button>
                <button className={styles.otherButton} onClick={generateNewCode}>Timeout? Generate a new code</button>
            </div>
        </div>
    </div>;
}

export default VerifyContainer;