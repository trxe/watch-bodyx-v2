import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { IAttendee } from '../containers/Attendees';
import { IRoom } from '../containers/Rooms';
import { INotif } from '../containers/Snackbar';

interface ISocketContext {
    socket: Socket;
    ticket: string;
    setTicket: Function;
    isAdmin: boolean;
    show?: {name: string, eventId: string, rooms: Array<IRoom>, attendees: Array<IAttendee>};
    setShow: Function;
    error?: INotif;
    setError: Function;
    isLoggedIn: boolean;
}

let socket = io(SOCKET_URL);

export const getSocketInfo = () => {
    console.log('socket', socket);
}

/* When React renders a component that subscribes to this Context object 
* it will read the current context value from the closest matching Provider 
* above it in the tree.
*/
const SocketContext = createContext<ISocketContext>({
    socket, 
    ticket: '', 
    setTicket: () => false, 
    isAdmin: false,
    isLoggedIn: false,
    setError: () => false,
    setShow: () => false,
    // rooms: {}, 
    // messages: [], 
    // setMessages: () => false,
})

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoggedIn, setLoggedIn] = useState(false)
    const [ticket, setTicket] = useState('');
    const [show, setShow] = useState({})
    const [error, setError] =  useState(null)

    if (socket != null) {
        socket.on(EVENTS.SERVER.INVALID_LOGIN, (err) => {
            setError(err);
        });

        socket.on(EVENTS.SERVER.GENERIC_ERROR, (err) => {
            setError(err);
        });

        socket.on(EVENTS.SERVER.PRIVILEGE, ({isAdmin, ticket}) => {
            // set privilege level
            console.log('am i admin?', isAdmin);
            setLoggedIn(true);
            setIsAdmin(isAdmin);
            setTicket(ticket);
            localStorage.setItem('ticket', ticket);
        })

        socket.on(EVENTS.SERVER.CURRENT_SHOW, (show) => {
            console.log("show attendees:", show);
            setShow(show);
        });
    }

    return <SocketContext.Provider 
        value={{socket, ticket, setTicket, isAdmin, show, setShow, error, setError, isLoggedIn}} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;