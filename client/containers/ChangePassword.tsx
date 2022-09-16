import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Login.module.css";
import { createNotif } from "./Snackbar";


const SetPasswordContainer = () => {
  const {setNotif, user, changePassword} = useSockets();
  const [isRegistering, setRegistering] = useState(false);
  const passwordRef = useRef(null);
  const passwordConfirmRef = useRef(null);
  const router = useRouter();

  const handleChangePwd = () => {
      const email = user.email;
      const password = passwordRef.current.value;
      if (!password) {
          setNotif(createNotif('error', 'Password cannot be empty.', 'Enter the same password in both fields.'));
          return;
      }
      if (!passwordConfirmRef.current.value) {
          setNotif(createNotif('error', 'Enter your password again to confirm.', 'Enter the same password in both fields.'));
          return;
      }
      if (password !== passwordConfirmRef.current.value) {
          setNotif(createNotif('error', 'Passwords do not match.', 'Enter the same password in both fields.'));
          passwordConfirmRef.current.value = '';
          return;
      }
      setRegistering(true);
      changePassword({email, password}, (dst) => {
          setRegistering(false);
          if (dst) router.push(dst);
      });
    }

    return <div className={styles.loginWrapper}>
        <div className={styles.loginDetails}>
            <h1>Set password</h1>
            <input placeholder='Password' ref={passwordRef}  type="password"/>
            <input placeholder='Confirm password' ref={passwordConfirmRef} type="password"/>
            <div className={styles.buttons}>
                <button className={styles.loginButton} onClick={handleChangePwd} disabled={isRegistering}>SET PASSWORD</button>
            </div>
        </div>
    </div>;
}

export default SetPasswordContainer;