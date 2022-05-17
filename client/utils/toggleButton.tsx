import { useEffect, useRef } from "react";
import styles from "../styles/Utils.module.css"

const ToggleButton = ({action, label, isSelected, disabled}) => {
    const toggleRef = useRef(null);

    useEffect(() => {
        if (isSelected) toggleRef.current.checked = true;
    }, [isSelected]);

    return <div className={styles.toggleWrapper}>
        <div className={styles.toggleLabel}>{label}</div>
        <label className={styles.toggleBox}>
            <input type="checkbox" onClick={() => action(toggleRef)} ref={toggleRef} disabled={disabled}/>
            <span className={`${styles.toggleSlider} ${styles.round}`}></span>
        </label>
        </div>;
}

export default ToggleButton;