import { useEffect, useLayoutEffect, useRef, useState } from "react";
import EVENTS from "../config/events";
import { Message, useChatRooms } from "../context/chats.context";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Chat.module.css";

const ChatContextMenu = ({_id, message, msgIndex}) => {
    const [contextData, setContextData] = useState({visible: false, posX: 0, posY: 0});
    const contextRef = useRef(null);
    const {socket, setNotif} = useSockets();
    const {chatRoomName, currentChatRoom} = useChatRooms();

    useEffect(() => {
        const offClickHandler = (event) => {
            if(contextRef.current && !contextRef.current.contains(event.target)){
                console.log('close', event.target, contextRef.current);
                setContextData({ ...contextData, visible: false })
            }
        }

        const contextMenuHandler = (event) => {
            const element  = document.getElementById(_id);
            if (element && element.contains(event.target)) {
                console.log('open', event.target, element);
                event.preventDefault();
                setContextData({visible: true, posX: event.clientX, posY: event.clientY});
            } else if (element && !element.contains(event.target)) {
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
    }, []);

    const styling = () => {
        return {
            display: contextData.visible ? 'block' : 'none',
            left: contextData.posX,
            top: contextData.posY
        };
    }

    const isPin = () => message.isPinned || currentChatRoom.pins.has(msgIndex);

    const sendPinMessage = () => {
        // console.log('pinning', msgIndex, 'to', chatRoomName, message);
        socket.emit(EVENTS.CLIENT.PIN_MESSAGE, {msgIndex, chatName: chatRoomName}, (res) => {
            if (res.messageType !== 'info') setNotif(res);
        });
    }

    const unpinMessage = () => {
        // console.log('unpinning', message, 'to', chatRoomName);
        socket.emit(EVENTS.CLIENT.UNPIN_MESSAGE, {msgIndex, chatName: chatRoomName}, (res) => {
            if (res.messageType !== 'info') setNotif(res);
        });
    }

    return <div ref={contextRef} className={styles.contextMenu} style={styling()}>
        <ul className={styles.dropdown}>
            <li> <a href="#" onClick={isPin() ? unpinMessage : sendPinMessage}>
                {isPin() ? 'Unpin' : 'Pin'}</a> </li>
        </ul>
    </div>;
}

const PinContainer = ({msgIndex, message}) => {
    const {user} = useSockets();

    if (!user) return null;

    // console.log(msgIndex, message, isAdmin);
    return <div id={`pin-${msgIndex}`} 
            className={`${styles.message} ${styles.messagePin}`}>
        {user.isAdmin && !message.isPrivate && <ChatContextMenu _id={`pin-${msgIndex}`} message={message} msgIndex={msgIndex}/>}
        <div className={styles.textBox}>
            {message.userName}: {message.contents}
        </div>
    </div>;

}

const MessageContainer = ({index, message}) => {
    const {user} = useSockets();
    const {currentChatRoom} = useChatRooms();
    const isSelf = message.userName === user.name;

    const serverMsgIndex = currentChatRoom.serverMsgIndex(index);

    return <div id={`message-${index}`} 
            className={`${styles.message} ${isSelf ? styles.messageSelf : styles.messageOther}`}>
        {user.isAdmin && !message.isPrivate && <ChatContextMenu _id={`message-${index}`} message={message} msgIndex={serverMsgIndex}/>}
        <div className={styles.textBox}>
            {isSelf ? '': `${message.userName}: `}{message.contents}
        </div>
    </div>;
}

const ChatContainer = ({chatName, isPrivate, label}) => {
    const {socket, user, roomName} = useSockets();
    const {messages, updateMessageList, pins, 
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
    }, [roomName])

    // sends to a room
    const handleSendMessage = () => {
        if (newMessageRef.current.value.length == 0) return;
        const partialMsg: Message = {
            _id: null, // cannot pin when id is null
            userName: user.name, 
            fromSocketId: socket.id,
            sendTo: chatName,
            timestamp: new Date().toISOString(),
            contents: newMessageRef.current.value,
            isPrivate,
            isPinned: false,
        };
        updateMessageList();
        newMessageRef.current.value = '';
        socket.emit(EVENTS.CLIENT.NEW_MESSAGE, partialMsg, (res) => {
            if (res.messageType === 'info') {
                const {message, msgIndex} = JSON.parse(res.message);
                currentChatRoom.addMessage(message, msgIndex);
                updateMessageList();
                scrollToBottom();
            }
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    if (!currentChatRoom || !user) {
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
        <div className={styles.pinList}>
            {pins.map(pin => <PinContainer key={pin.msgIndex} {...pin} />)}
        </div>
        <div className={styles.messageList}>
            {messages.map((msg, index) => 
                <MessageContainer key={index} index={index} message={msg} />
            )}
            <div ref={messagesEndRef} />
        </div>
        {(isPrivate || isViewerChatEnabled || user.isAdmin) &&
            <div>
                <textarea rows={3} placeholder={`Send a message (max length ${maxCharCount})`} 
                    maxLength={maxCharCount} ref={newMessageRef}/>
                <button onClick={handleSendMessage}>SEND</button>
            </div>
        }
    </div>;

}

export default ChatContainer;