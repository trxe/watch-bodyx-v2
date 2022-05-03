import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { Message, useChatRooms } from "../context/chats.context";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Chat.module.css";
import { generateDateBasedID } from "../utils/generateId";

const ChatContextMenu = ({_id, message}) => {
    const [contextData, setContextData] = useState({visible: false, posX: 0, posY: 0});
    const contextRef = useRef(null);

    useEffect(() => {
        const offClickHandler = (event) => {
            if(contextRef.current && !contextRef.current.contains(event.target)){
                setContextData({ ...contextData, visible: false })
            }
        }

        const contextMenuHandler = (event) => {
            const element  = document.getElementById(_id);
            if (element && element.contains(event.target)) {
                event.preventDefault();
                setContextData({visible: true, posX: event.clientX, posY: event.clientY});
            } else {
                offClickHandler(event);
            }
        }

        document.addEventListener('contextmenu', contextMenuHandler)
        document.addEventListener('click', offClickHandler)
        return () => {
            document.removeEventListener('contextmenu', contextMenuHandler)
            document.removeEventListener('click', offClickHandler)
        }
    }, [contextData, _id]);

    useLayoutEffect(() => {
        if (contextData.posX + contextRef.current?.offsetWidth > window.innerWidth){
            setContextData({ ...contextData, posX: contextData.posX - contextRef.current?.offsetWidth})
        }
        if (contextData.posY + contextRef.current?.offsetHeight > window.innerHeight){
            setContextData({ ...contextData, posY: contextData.posY - contextRef.current?.offsetHeight})
        }
    }, [contextData]);

    const styling = () => {
        return {
            display: contextData.visible ? 'block' : 'none',
            left: contextData.posX,
            top: contextData.posY
        };
    }

    const sendPinMessage = () => {
        console.log(message);
    }

    return <div ref={contextRef} className={styles.contextMenu} style={styling()}>
        <ul className={styles.dropdown}>
            <li> <a href="#" onClick={sendPinMessage}>Pin</a> </li>
        </ul>
    </div>;
}

const MessageContainer = ({index, isAdmin, message}) => {
    const {user} = useSockets();
    const isSelf = message.userName === user.name;

    return <div id={`message-${index}`} className={`${styles.message} ${isSelf ? styles.messageSelf : styles.messageOther}`}>
        {isAdmin && <ChatContextMenu _id={`message-${index}`} message={message}/>}
        <div className={styles.textBox}>
            {isSelf ? '': `${message.userName}: `}{message.contents}
        </div>
    </div>;
}

const ChatContainer = ({chatName, isAdmin}) => {
    const {socket, user} = useSockets();
    const {chatRooms, currentChatRoom, setChatRooms, selectChatRoomName, isViewerChatEnabled} = useChatRooms();
    const [messages, setMessages] = useState(!currentChatRoom ? [] : currentChatRoom.messages);
    const [pins, setPins] = useState(!currentChatRoom ? [] : currentChatRoom.pins);
    const newMessageRef = useRef(null);

    useEffect(() => {
        console.log('switching to', chatName);
        setChatRooms();
        // temporary
        selectChatRoomName(chatName);
        setMessages([...chatRooms.get(chatName).messages]);
    }, [])

    // sends to a room
    const handleSendMessage = () => {
        console.log("sending to", chatName);
        if (newMessageRef.current.value.length == 0) return;
        const index = messages.length;
        const message: Message = {
            _id: generateDateBasedID(),
            userName: user.name, 
            fromSocketId: socket.id,
            sendTo: [chatName],
            timestamp: new Date().toISOString(),
            contents: newMessageRef.current.value,
            status: 'sending'
        };
        setMessages([...messages, message]);
        newMessageRef.current.value = '';
        socket.emit(EVENTS.CLIENT.NEW_MESSAGE, message, (res) => {
            console.log(message, index);
            currentChatRoom.addMessage(message);
            setPins([...pins, message]);
            setMessages([...currentChatRoom.messages]);
        });
    };

    socket.off(EVENTS.SERVER.DELIVER_MESSAGE)
        .on(EVENTS.SERVER.DELIVER_MESSAGE, (message: Message) => {
            if (message.fromSocketId === socket.id) return;
            // only update if this chat is the correct recepient room
            if (message.sendTo.find(chatName) == null) return;
            currentChatRoom.addMessage(message);
            setMessages([...currentChatRoom.messages]);
    });

    return <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
            <h3>{chatName}</h3>
        </div>
        {pins.length != 0 &&
            <div className={styles.messagePin}>
                <MessageContainer index={-1} isAdmin={isAdmin} message={pins[pins.length-1]} />
            </div>
        }
        <div className={styles.messageList}>
            {messages.map((msg, index) => 
                <MessageContainer key={index} index={index} isAdmin={isAdmin} message={msg} />
            )}
        </div>
        {(isViewerChatEnabled || chatName == CHANNELS.SM_ROOM) &&
            <div>
                <textarea rows={3} placeholder='Send a message' ref={newMessageRef}/>
                <button onClick={handleSendMessage}>SEND</button>
            </div>
        }
    </div>;

}

export default ChatContainer;