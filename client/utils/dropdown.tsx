import { FC } from "react";
import styles from "../styles/Utils.module.css"

export interface DropdownOptions {
    title: any;
    labels: Array<string>,
    actions: Array<(string) => void>;
    style?
}

const DropdownMenu:FC<DropdownOptions> = ({style, title, labels, actions}) => {
    return <div style={style} className={styles.dropdownWrapper}>
        <button className={styles.dropdownButton}>{title}</button>
        <ul className={styles.dropdown}>
            {labels.map((label, i) => 
                <li key={i}>
                    <a href="#" 
                        onClick={i < actions.length ? actions[i] : () => console.log("No action")}>
                        {label}
                    </a>
                </li>
            )}
        </ul>
    </div>;
}

export default DropdownMenu;