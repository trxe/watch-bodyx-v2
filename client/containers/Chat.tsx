import { FC, useEffect, useRef, useState } from "react";
import { CHANNELS } from "../config/channels";
import EVENTS from "../config/events";
import { Message, useChatRooms } from "../context/chats.context";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Chat.module.css";
import { generateDateBasedID } from "../utils/generateId";

const MessageContainer:FC<Message> = ({userName, contents}) => {
    return <div className={styles.messageWrapper}>
        <p> {userName}: {contents} </p>
    </div>;
}

const ChatContainer = () => {
    const {socket, show, user, channel} = useSockets();
    const {currentChatRoom, setChatRooms, selectChatRoomName} = useChatRooms();
    const [messages, setMessages] = useState(!currentChatRoom ? [] : currentChatRoom.messages);
    const newMessageRef = useRef(null);

    useEffect(() => {
        setChatRooms(show);
        // temporary
        selectChatRoomName(CHANNELS.SM_ROOM);
    }, [show])

    // sends to a room
    const handleSendMessage = () => {
        console.log("sending to", channel);
        if (newMessageRef.current.value.length == 0) return;
        const index = messages.length;
        const message: Message = {
            _id: generateDateBasedID(),
            userName: user.name, 
            fromSocketId: socket.id,
            sendTo: [channel],
            timestamp: new Date().toISOString(),
            contents: newMessageRef.current.value,
            status: 'sending'
        };
        setMessages([...messages, message]);
        newMessageRef.current.value = '';
        socket.emit(EVENTS.CLIENT.NEW_MESSAGE, message, (res) => {
            console.log(message, index);
            currentChatRoom.addMessage(message);
            setMessages([...currentChatRoom.messages]);
        });
    };

    socket.off(EVENTS.SERVER.DELIVER_MESSAGE)
        .on(EVENTS.SERVER.DELIVER_MESSAGE, (message) => {
            if (message.fromSocketId === socket.id) return;
            currentChatRoom.addMessage(message);
            setMessages([...currentChatRoom.messages]);
    });

    return <div>
        {messages.map((msg, index) => 
            <MessageContainer key={index} {...msg} />
        )}
        <div>
            <textarea rows={3} placeholder='Send a message' ref={newMessageRef}/>
            <button onClick={handleSendMessage}>SEND</button>
        </div>
    </div>;

}

export default ChatContainer;