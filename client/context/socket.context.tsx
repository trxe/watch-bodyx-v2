import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { IRoom } from '../containers/Rooms';

interface ISocketContext {
    socket: Socket;
    ticket: string;
    setTicket: Function;
    isAdmin: boolean;
    show?: {name: string, eventId: string, rooms: Array<IRoom>};
    // roomId?: string;
    // rooms: object;
    // messages: Array<{message: string, time: string, ticket: string}>;
    // setMessages: Function;
}

const socket = io(SOCKET_URL);

/* When React renders a component that subscribes to this Context object 
* it will read the current context value from the closest matching Provider 
* above it in the tree.
*/
const SocketContext = createContext<ISocketContext>({
    socket, 
    ticket: "", 
    setTicket: () => false, 
    isAdmin: false,
    // rooms: {}, 
    // messages: [], 
    // setMessages: () => false,
})

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [ticket, setTicket] = useState("");
    const [show, setShow] = useState({})
    // const [roomId, setRoomId] = useState("");
    // const [rooms, setRooms] = useState({});
    // const [messages, setMessages] = useState([]);

    socket.on(EVENTS.SERVER.PRIVILEGE, ({isAdmin, ticket}) => {
        // set privilege level
        console.log("am i admin?", isAdmin);
        setIsAdmin(isAdmin);
        setTicket(ticket);
        localStorage.setItem('ticket', ticket);
    })

    socket.on(EVENTS.SERVER.CURRENT_SHOW, ({name, eventId, rooms}) => {
        setShow({ name, eventId, rooms });
    });

    /*
    socket.on(EVENTS.SERVER.ROOMS, (value) => {
        setRooms(value);
    })

    socket.on(EVENTS.SERVER.JOINED_ROOM, (value) => {
        setRoomId(value);
        setMessages([]);
    })

    socket.on(EVENTS.SERVER.ROOM_MESSAGE, ({ message, ticket, time }) => {
        if (!document.hasFocus()) {
            document.title = "New message";
        }
        setMessages([
            ...messages,
            {message, ticket, time}
        ]);
    })
    */
    
    return <SocketContext.Provider 
        // value={{socket, ticket, setTicket, roomId, rooms, messages, setMessages, isAdmin}} 
        value={{socket, ticket, setTicket, isAdmin, show}} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider