import { createContext, useContext, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { ROOMS } from '../config/roomNames';
import { IRoom } from '../containers/Rooms';
import { INotif } from '../containers/Snackbar';
import { User } from '../containers/Users';

interface ISocketContext {
    socket: Socket
    channel: string
    setChannel: Function
    user: {
        name: string,
        email: string,
        ticket: string,
        firstName: string,
        isAdmin: boolean
    }
    setUser: Function,
    show?: {
        name: string, 
        eventId: string, 
        rooms: Array<IRoom>, 
        attendees: Map<string, User>
    }
    setShow: Function
    notif?: INotif
    setNotif: Function
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
    channel: ROOMS.LOGIN_ROOM,
    setChannel: () => false,
    user: null,
    setUser: () => false, 
    setNotif: () => false,
    setShow: () => false,
})

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [user, setUser] =  useState(null)
    const [channel, setChannel] = useState(false)
    const [show, setShow] = useState({})
    const [notif, setNotif] =  useState(null)

    if (socket != null) {

        socket.on(EVENTS.SERVER.CLIENT_INFO, ({roomName, user}) => {
            console.log(roomName, user);
            setUser(user);
            setChannel(roomName)
            localStorage.setItem('email', user.email);
            localStorage.setItem('ticket', user.ticket);
        });

        socket.on(EVENTS.SERVER.CURRENT_SHOW, (newShow, callback) => {
            const currShow = {...newShow, attendees: null};
            if (newShow.attendees != null) {
                currShow.attendees = new Map(Object.entries(newShow.attendees));
            }
            setShow(currShow);
            callback(`Socket ${socket.id} has received show.`);
        });
    }

    return <SocketContext.Provider 
        value={{
            socket, 
            channel, 
            setChannel, 
            user, 
            setUser, 
            show, 
            setShow, 
            notif, 
            setNotif, 
        }} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;