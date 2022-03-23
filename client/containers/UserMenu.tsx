import { AiOutlineMenu } from 'react-icons/ai';
import styles from '../styles/Viewer.module.css';

const UserMenu = () => {
    return <button className={styles.iconButton}>
        <AiOutlineMenu />
    </button>;
}

export default UserMenu;