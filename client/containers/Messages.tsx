import { useRef } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";

const MessagesContainer = () => {
    /*
    const {socket, messages, setMessages, roomId, ticket} = useSockets();
    const newMessageRef = useRef(null);

    const handleSendMessage = () => {
        const message = newMessageRef.current.value;
        if (!String(message).trim()) return;

        socket.emit(EVENTS.CLIENT.SEND_ROOM_MESSAGE, {roomId, message, ticket})

        const date = new Date();
        
        setMessages([...messages, {
            message, 
            ticket: 'You', 
            time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        }])
    }

    if (!roomId) return <div></div>;

    return <div>
        {messages.map((msg, index) => 
            <p key={index}>
                {msg.ticket}: {msg.message}
            </p>)
        }
        <div className="MessageBox">
            <textarea rows={1} placeholder='Send a message' ref={newMessageRef}/>
            <button onClick={handleSendMessage}>SEND</button>
        </div>
    </div>;
    */
   return <div>Messages</div>;
}

export default MessagesContainer;