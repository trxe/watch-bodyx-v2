import { FC } from "react";
import styles from "../styles/Dropdown.module.css"

export interface DropdownOptions {
    title: any;
    labels: Array<string>,
    actions: Array<(string) => void>;
}

// The CSS here needs some serious repair.
const DropdownMenu:FC<DropdownOptions> = ({title, labels, actions}) => {
    return <div>
        <button className={styles.mainButton}>{title}</button>
        <ul className={styles.dropdown}>
            {labels.map((label, i) => 
                <li key={i}>
                    <a href="#" onClick={i < actions.length ? actions[i] : () => {}}>{label}</a>
                </li>
            )}
        </ul>
    </div>;
}

export default DropdownMenu;