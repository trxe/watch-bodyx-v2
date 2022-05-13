import styles from "../styles/Utils.module.css"

export const SampleModal = () => {
    return <div>
        <a href="#openModal">Open</a>
        <Modal width={80} id="openModal">
            <h1>Fecker</h1>
            <a href="#closeModal" title="Close" className={styles.closeModal}>Close</a>
        </Modal>
    </div>
}

const Modal = ({id, children, width}) => {
    return <div id={id} className={styles.modalWrapper}>
        <div className={styles.modal} style={{width}}>
            {children}
        </div>
    </div>;
}

export default Modal;