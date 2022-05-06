import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { Message, useChatRooms } from "../context/chats.context";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Chat.module.css";

const ChatContextMenu = ({_id, message, localMsgIndex, pinIndex}) => {
    const [contextData, setContextData] = useState({visible: false, posX: 0, posY: 0});
    const contextRef = useRef(null);
    const {currentChatRoom} = useChatRooms();

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
        console.log('pinning', message);
    }

    const unpinMessage = () => {
        console.log('unpinning', message);
    }

    const isPin = () => pinIndex > 0 || currentChatRoom.pinMsgIndices.has(localMsgIndex);

    return <div ref={contextRef} className={styles.contextMenu} style={styling()}>
        <ul className={styles.dropdown}>
            <li> <a href="#" onClick={isPin() ? unpinMessage : sendPinMessage}>
                {isPin() ? 'Unpin' : 'Pin'}</a> </li>
        </ul>
    </div>;
}

const MessageContainer = ({index, isAdmin, message}) => {
    const {user} = useSockets();
    const isSelf = message.userName === user.name;

    return <div id={`message-${index}`} 
            className={`${styles.message} ${isSelf ? styles.messageSelf : styles.messageOther}`}>
        {isAdmin && <ChatContextMenu _id={`message-${index}`} 
                message={message} localMsgIndex={index} pinIndex={-1}/>}
        <div className={styles.textBox}>
            {isSelf ? '': `${message.userName}: `}{message.contents}
        </div>
    </div>;
}

const ChatContainer = ({chatName, isAdmin, label}) => {
    const {socket, user} = useSockets();
    const {messages, setMessages, pins, 
            isViewerChatEnabled, 
            selectChatRoomName, 
            currentChatRoom} = useChatRooms();
    const maxCharCount = 150;
    const newMessageRef = useRef(null);
    const messagesEndRef = useRef(null)

    useEffect(() => {
        // temporary
        selectChatRoomName(chatName);
        scrollToBottom();
    }, [chatName, messages, pins])

    // sends to a room
    const handleSendMessage = () => {
        if (newMessageRef.current.value.length == 0) return;
        const partialMsg: Message = {
            _id: null, // cannot pin when id is null
            userName: user.name, 
            fromSocketId: socket.id,
            sendTo: [chatName],
            timestamp: new Date().toISOString(),
            contents: newMessageRef.current.value,
            isPinned: false,
        };
        setMessages([...messages, partialMsg]);
        newMessageRef.current.value = '';
        socket.emit(EVENTS.CLIENT.NEW_MESSAGE, partialMsg, (res) => {
            if (res.messageType === 'info') {
                const {message, msgIndex} = JSON.parse(res.message);
                currentChatRoom.addMessage(message, msgIndex);
                setMessages([...currentChatRoom.messages]);
                scrollToBottom();
            }
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    if (!currentChatRoom) {
        return <div className={styles.chatWrapper}>
            <div className={styles.chatHeader}>
                <h3>Chat Unavailable</h3>
            </div>
        </div>;
    }

    return <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
            <h3>{label}</h3>
        </div>
        <div className={styles.messageList}>
            {messages.map((msg, index) => 
                <MessageContainer key={index} index={index} isAdmin={isAdmin} message={msg} />
            )}
            <div ref={messagesEndRef} />
        </div>
        {(chatName == CHANNELS.SM_ROOM || isViewerChatEnabled || isAdmin) &&
            <div>
                <textarea rows={3} placeholder={`Send a message (max length ${maxCharCount})`} 
                    maxLength={maxCharCount} ref={newMessageRef}/>
                <button onClick={handleSendMessage}>SEND</button>
            </div>
        }
    </div>;

}

export default ChatContainer;