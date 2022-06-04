import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import EVENTS from "../config/events";
import { Message, useChatRooms } from "../context/chats.context";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Chat.module.css";
import { classList, timeFormat } from "../utils/utils";

interface ChatContainerProps {
    chatName: string
    isPrivate: boolean
    label: string
    style?
}

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
    const isSelf = message.userName === user.name;

    if (!user) return null;

    return <div className={classList(styles.message, isSelf ? styles.messageSelf : styles.messageOther)}>
        {user.isAdmin && !message.isPrivate && <ChatContextMenu _id={`pin-${msgIndex}`} message={message} msgIndex={msgIndex}/>}
        <div id={`pin-${msgIndex}`} className={classList(styles.textBox, isSelf ? styles.textBoxSelf : styles.textBoxOther)}>
            {!isSelf && <p>{isSelf ? '': message.userName}</p>}
            {message.contents}
        </div>
    </div>;

}

const MessageContainer = ({index, message}) => {
    const {user} = useSockets();
    const {currentChatRoom} = useChatRooms();
    const isSelf = message.userName === user.name;

    const serverMsgIndex = currentChatRoom.serverMsgIndex(index);

    return <div className={classList(styles.message, isSelf ? styles.messageSelf : styles.messageOther)}>
        {user.isAdmin && !message.isPrivate && <ChatContextMenu _id={`message-${index}`} message={message} msgIndex={serverMsgIndex}/>}
        <div id={`message-${index}`} className={classList(styles.textBox, isSelf ? styles.textBoxSelf : styles.textBoxOther)}>
            {!isSelf && <p>{isSelf ? '': message.userName}</p>}
            {message.contents}
            <div className={styles.timestamp}>{timeFormat(message.timestamp)}</div>
        </div>
    </div>;
}

const ChatContainer:FC<ChatContainerProps> = ({style, chatName, isPrivate, label}) => {
    const {socket, user, roomName} = useSockets();
    const {messages, updateMessageList, pins, clearUnreadRoom,
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
    }, [roomName]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                clearUnreadRoom();
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

    return <div style={style} className={styles.chatWrapper}>
        {pins.length > 0 && <div className={styles.pinList}>
            <div className={styles.pinHeader}>Pins</div>
            {pins.map(pin => <PinContainer key={pin.msgIndex} {...pin} />)}
        </div>}
        <div className={styles.chatHeader}>
            {label}
        </div>
        <div className={styles.messageList}>
            {messages.map((msg, index) => 
                <MessageContainer key={index} index={index} message={msg} />
            )}
            <div ref={messagesEndRef} />
        </div>
        {(isPrivate || isViewerChatEnabled || user.isAdmin) &&
            <div className={styles.sendArea}>
                <textarea rows={2} placeholder={`Send a message (max length ${maxCharCount})`} 
                    maxLength={maxCharCount} ref={newMessageRef}/>
                <button onClick={handleSendMessage}>SEND</button>
            </div>
        }
    </div>;

}

export default ChatContainer;