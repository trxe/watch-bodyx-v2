import { useEffect, useState } from 'react';
import { useSockets } from '../context/socket.context';
import styles from '../styles/QnA.module.css'
import ChatContainer from './Chat';
import { Client } from './Clients';

const QNAContainer = () => {
    const {socket, clientsList} = useSockets();
    const isClientMe = (client: Client) => socket != null && client.socketId == socket.id;

    useEffect(() => {
        console.log("private chats", clientsList);
    }, [clientsList]);

    const [chosenClient, setChosenClient] = useState(clientsList.find(c => !isClientMe(c)));

    if (!socket) return null;
    // MAKE PRIVATE CHAT DIFFERENT
    // {chosenClient && <ChatContainer chatName={chosenClient.socketId} isAdmin={true} isQNA={true}/> }

    return <div className={styles.qnaWrapper}>
        <div className={styles.clientsSelect}>
            <ul>
                {clientsList.map(client => { return isClientMe(client) ? null : 
                    <li><a href="#" onClick={() => setChosenClient(client)}>{client.user.name}</a></li>
                })}
            </ul>
        </div>
    </div>;
}

export default QNAContainer;