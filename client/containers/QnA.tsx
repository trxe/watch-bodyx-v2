import { useEffect, useRef, useState } from 'react';
import { useChatRooms } from '../context/chats.context';
import { useSockets } from '../context/socket.context';
import styles from '../styles/QnA.module.css'
import ChatContainer from './Chat';
import { IoMdArrowBack } from 'react-icons/io';
import { Client } from './Clients';

const QNAContainer = () => {
    const HIDE_STYLE = {width: '0%', opacity: '0%', margin: 0, padding: 0};
    const FULL_WIDTH_STYLE = {width: '90%', opacity: '100%', margin: "1em", padding: "0.5em"};
    const {socket, clientsList} = useSockets();
    const [chosenClient, setChosenClient] 
        = useState(clientsList.find((client: Client) => socket != null && client.socketId !== socket.id));
    const {unreadCounts, selectChatRoomName} = useChatRooms();
    const [isChatOpen, setChatOpen] = useState(false);
    const filterNameRef = useRef(null);
    const [filterKeyword, setFilterKeyword] = useState('');

    useEffect(() => {
        if (chosenClient != null) selectChatRoomName(chosenClient.socketId);
    }, [clientsList]);

    const selectClient = (client: Client) => {
        setChosenClient(client);
        selectChatRoomName(client.socketId);
        setChatOpen(true);
    }

    const filterName = (client: Client) => {
        const search = filterKeyword.length == 0 || client.user.name.toLowerCase().indexOf(filterKeyword) >= 0;
        return socket != null && client.socketId !== socket.id && search;
    }

    const closeClient = () => {
        setChatOpen(false);
    }

    if (!socket) return null;

    return <div className={styles.qnaWrapper}>
        <div className={styles.clientsSelect} style={window.innerWidth < 600 ? (isChatOpen ? HIDE_STYLE: FULL_WIDTH_STYLE) : null}>
            <input ref={filterNameRef} onChange={() => setFilterKeyword(filterNameRef.current.value)} placeholder='Search'/>
            <ul>
                {clientsList.filter(filterName).map(client => 
                    <li onClick={() => selectClient(client)} key={client.socketId}
                        className={chosenClient && chosenClient.socketId === client.socketId ? styles.isSelected : null}>
                        {client.user.name}
                        {unreadCounts[client.socketId] &&
                        <span className={styles.badge}>
                            {unreadCounts[client.socketId]}
                        </span>}
                    </li>
                )}
            </ul>
        </div>
        <div className={styles.chatArea} style={window.innerWidth < 600 ? (isChatOpen ? FULL_WIDTH_STYLE : HIDE_STYLE) : null}>
            <button className={styles.backButton} onClick={closeClient}><IoMdArrowBack /></button>
            {chosenClient != null && 
                <ChatContainer style={{display: "absolute", width: "100%"}} chatName={chosenClient.socketId} isPrivate={true} label={chosenClient.user.name} />
            }
        </div>
    </div>;
}

export default QNAContainer;