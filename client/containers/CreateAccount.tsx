import { useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";
import { createNotif } from "./Snackbar";


const CreateAccountContainer = () => {
  const {setNotif, user, createAccount} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const passwordRef = useRef(null);
  const passwordConfirmRef = useRef(null);

  const handleSetPwd = () => {
      const password = passwordRef.current.value;
      if (password !== passwordConfirmRef.current.value) {
          setNotif(createNotif('error', 'Passwords do not match.', 'Enter the same password in both fields.'));
          return;
      }
      setRegistering(true);
      createAccount({user, password}, () => setRegistering(false));
  }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Set a password</h1>
            <input placeholder='Password' ref={passwordRef}  type="password"/>
            <input placeholder='Confirm password' ref={passwordConfirmRef} type="password"/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleSetPwd} disabled={isRegistering}>CHANGE</button>
            </div>
        </div>
    </div>;
}

export default CreateAccountContainer;