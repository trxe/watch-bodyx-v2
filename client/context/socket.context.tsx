import { createContext, useContext, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { CHANNELS } from '../config/channels';
import { IRoom } from '../containers/Rooms';
import { INotif } from '../containers/Snackbar';
import { User } from '../containers/Clients';

interface ISocketContext {
    socket: Socket
    channel: string
    setChannel: Function
    room?: string
    setRoom: Function
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
        isOpen: boolean,
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
    channel: CHANNELS.LOGIN_ROOM,
    setChannel: () => false,
    user: null,
    setRoom: () => false,
    setUser: () => false, 
    setNotif: () => false,
    setShow: () => false,
})

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [user, setUser] =  useState(null)
    const [channel, setChannel] = useState(null)
    const [show, setShow] = useState({})
    const [notif, setNotif] =  useState(null)

    if (socket != null) {
        socket.on(EVENTS.SERVER.CLIENT_INFO, ({channelName, user}) => {
            console.log(channelName, user);
            setUser(user);
            setChannel(channelName);
            localStorage.setItem('email', user.email);
            localStorage.setItem('ticket', user.ticket);
        });

        socket.on(EVENTS.SERVER.CURRENT_SHOW, (newShow, callback) => {
            const currShow = {...newShow, attendees: null};
            if (newShow.attendees != null) {
                currShow.attendees = new Map(Object.entries(newShow.attendees));
            }
            setShow(currShow);
            callback(socket.id);
        });

        socket.off(EVENTS.SERVER.FORCE_JOIN_CHANNEL)
            .on(EVENTS.SERVER.FORCE_JOIN_CHANNEL, (newChannel) => {
                if (channel === newChannel) return;
                socket.emit(EVENTS.CLIENT.JOIN_CHANNEL, newChannel, 
                    (response) => {
                        setChannel(newChannel);
                        setNotif(response);
                    });
        });

        socket.on(EVENTS.SERVER.FORCE_DISCONNECT, ({msg}) => {
            console.log(msg);
            setChannel(CHANNELS.DISCONNECTED);
            socket.disconnect();
        });

        socket.on(EVENTS.SERVER.CURRENT_ROOMS, (rooms, callback) => {
            setShow({...show, rooms});
            if (callback != null) callback(socket.id);
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