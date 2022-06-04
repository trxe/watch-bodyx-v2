import { FC, MouseEventHandler } from "react"
import styles from "../styles/Utils.module.css"


export interface ModalInfo {
    id: String
    title: string
    description: string
    buttons: Array<{label: string, action: MouseEventHandler}>
}

export const ModalTemplate:FC<ModalInfo> = ({id, title, description, buttons}) => {
    return <Modal width={"80%"} id={id}>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.modalButtons}>
            {buttons.map((b, index) => <button key={index} onClick={b.action}>{b.label}</button>)}
        </div>
    </Modal>;
}

const Modal = ({id, children, width}) => {
    return <div id={id} className={styles.modalWrapper}>
        <div className={styles.modal} style={{width}}>
            {children}
        </div>
    </div>;
}

export default Modal;