import { FC, useEffect, useState } from "react"
import { useSockets } from "../context/socket.context";
import styles from '../styles/Snackbar.module.css'

export interface INotif {
    timer: number,
    messageType: 'error' | 'info' | 'warning' | 'success',
    title: string,
    message: string,
}

export const DEFAULT_TIMER = 4;

export const createNotif = (messageType: 'error' | 'info' | 'warning' | 'success', 
    title:string, 
    message:string, 
    timer?: number): INotif => {
        return {timer: timer || DEFAULT_TIMER, messageType, title, message}
}

const Snackbar:FC<INotif> = ({timer, messageType, title, message}) => {
    const {setNotif} = useSockets()
    const [closeTimeout, setCloseTimeout] = useState(null);

    useEffect(() => {
        beginCloseTimeout();
    }, []);

    const closeSnackbar = () => {
        clearTimeout(closeTimeout);
        setNotif(null);
    }

    const beginCloseTimeout = () => {
        const timeout = setTimeout(closeSnackbar, timer);
        setCloseTimeout(timeout);
    }

    return (
        <div className={styles.snackbarContainer}
            onMouseEnter={() => clearTimeout(closeTimeout)}
            onMouseLeave={() => beginCloseTimeout()}>
            <div>
                <div>
                    <div>
                        <h5>{title}</h5>
                        <h5>  {message}</h5>
                    </div>
                </div>
                <div>
                    <button onClick={closeSnackbar}>X</button>
                </div>
            </div>
        </div>
    );
}

export default Snackbar;