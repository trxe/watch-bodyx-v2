import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { IRoom } from '../containers/Rooms';
import { INotif } from '../containers/Snackbar';
import { User } from '../containers/Users';

interface ISocketContext {
    socket: Socket;
    ticket: string;
    setTicket: Function;
    isAdmin: boolean;
    show?: {name: string, eventId: string, rooms: Array<IRoom>, attendees: Map<string, User>};
    setShow: Function;
    error?: INotif;
    setNotif: Function;
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
    setNotif: () => false,
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
    const [error, setNotif] =  useState(null)

    if (socket != null) {

        socket.on(EVENTS.SERVER.CLIENT_INFO, ({roomName, user}) => {
            setLoggedIn(true);
            setIsAdmin(user.isAdmin);
            setTicket(user.ticket);
            localStorage.setItem('email', user.email);
            localStorage.setItem('ticket', user.ticket);
        });

        socket.on(EVENTS.SERVER.CURRENT_SHOW, (newShow, callback) => {
            const currShow = {...newShow, attendees: null};
            if (newShow.attendees != null) {
                currShow.attendees = new Map(Object.entries(newShow.attendees));
            }
            console.log("show attendees:", currShow);
            setShow(currShow);
            callback(`User ${ticket} has received show.`);
        });
    }

    return <SocketContext.Provider 
        value={{socket, ticket, setTicket, isAdmin, show, setShow, error, setNotif, isLoggedIn}} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;