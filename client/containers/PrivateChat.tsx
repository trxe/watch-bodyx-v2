import { useRef } from 'react';
import { useChatRooms } from '../context/chats.context';
import styles from '../styles/Chat.module.css'

const PrivateChatContainer = ({chatName, label}) => {
    const maxCharCount = 150;
    const newMessageRef = useRef(null);
    const messagesEndRef = useRef(null)
    const handleSendMessage = () => {}
    return <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
            <h3>{label}</h3>
        </div>
        <div className={styles.messageList}>
            <div ref={messagesEndRef} />
        </div>
        <div>
            <textarea rows={3} placeholder={`Send a message (max length ${maxCharCount})`} 
                maxLength={maxCharCount} ref={newMessageRef}/>
            <button onClick={handleSendMessage}>SEND</button>
        </div>
    </div>;

}

export default PrivateChatContainer;