import { useEffect, useState } from 'react';
import { useChatRooms } from '../context/chats.context';
import { useSockets } from '../context/socket.context';
import styles from '../styles/QnA.module.css'
import dashboard from '../styles/Dashboard.module.css'
import ChatContainer from './Chat';
import { Client } from './Clients';

const QNAContainer = () => {
    const {socket, clientsList} = useSockets();
    const isClientNotMe = (client: Client) => socket != null && client.socketId !== socket.id;
    const [chosenClient, setChosenClient] = useState(clientsList.find(isClientNotMe));
    const {selectChatRoomName} = useChatRooms();

    useEffect(() => {
        console.log("private chats", clientsList);
        if (chosenClient != null) selectChatRoomName(chosenClient.socketId);
    }, [clientsList]);

    const selectClient = (client: Client) => {
        setChosenClient(client);
        selectChatRoomName(client.socketId);
    }

    if (!socket) return null;

    return <div className={dashboard.row}>
        <div className={styles.clientsSelect}>
            <ul>
                {clientsList.filter(isClientNotMe).map(client => 
                    <li><a href="#" onClick={() => selectClient(client)}>{client.user.name}</a></li>
                )}
            </ul>
        </div>
        <div>
            {chosenClient != null && 
                <ChatContainer chatName={chosenClient.socketId} isPrivate={true} label={chosenClient.user.name} />
            }
        </div>
    </div>;
}

export default QNAContainer;