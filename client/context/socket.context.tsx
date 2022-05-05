import { createContext, useContext, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios'
import { SOCKET_URL } from '../config/default';
import EVENTS from '../config/events';
import { CHANNELS } from '../config/channels';
import { IRoom } from '../containers/Rooms';
import { createNotif, INotif } from '../containers/Snackbar';
import { Client, User } from '../containers/Clients';
import { useChatRooms } from './chats.context';

interface ISocketContext {
    socket: Socket
    channel: string
    setChannel: Function
    roomName?: string
    setRoomName: Function
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
    clients?: Map<string, Client>
    setClients: Function
    notif?: INotif
    setNotif: Function
    disconnectedInfo: string
    loginRequest: Function
}

let socket;

/* When React renders a component that subscribes to this Context object 
* it will read the current context value from the closest matching Provider 
* above it in the tree.
*/
const SocketContext = createContext<ISocketContext>({
    socket, 
    channel: CHANNELS.LOGIN_ROOM,
    setChannel: () => false,
    user: null,
    setRoomName: () => false,
    setUser: () => false, 
    setNotif: () => false,
    setShow: () => false,
    setClients: () => false,
    disconnectedInfo: '',
    loginRequest: () => false,
})

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [user, setUser] =  useState(null);
    const [channel, setChannel] = useState(null);
    const [roomName, setRoomName] = useState(null);
    const [show, setShow] = useState({});
    const [notif, setNotif] =  useState(null);
    const [disconnectedInfo, setDisconnectedInfo] = useState('');
    const {setChatRooms} = useChatRooms();
    const [clients, setClients] = useState(new Map<string, Client>());

    const loginInfo = (request) => {
        socket.emit(EVENTS.CLIENT.LOGIN, request, 
            (res) => { 
                console.log("socket", socket.id);
                if (res.messageType === 'warning' || res.messageType === 'error') {
                    setNotif(res); 
                } else if (res.messageType === 'info') {
                    const client = JSON.parse(res.message);
                    setUser(client.user);
                    setChannel(client.channelName);
                    const event = client.user.isAdmin 
                        ? EVENTS.CLIENT.REQUEST_ADMIN_INFO 
                        : EVENTS.CLIENT.REQUEST_VIEWER_INFO;
                    socket.emit(event, client, (ack) => console.log(ack));
                }
            });
    }

    const loginRequest = (request) => {
        axios.post(SOCKET_URL + "auth", request)
            .then(({data}) => {
                console.log(data);
                if (data.messageType === 'error') {
                    setNotif(data);
                    return;
                } 

                socket = io(SOCKET_URL);
                if (data.messageType === 'info') {
                    setNotif(createNotif('warning', 
                        'You are logged in on multiple instances',
                        'Other instances will be disconnected.'));
                    const socketIdDisconnect = data.message;
                    socket.emit(EVENTS.CLIENT.RECONNECT, {
                        oldSocketId: socketIdDisconnect, ...request
                    }, (res) => {
                        console.log("socket", socket.id);
                        if (res.messageType === 'warning' || res.messageType === 'error') {
                            setNotif(res); 
                        } else if (res.messageType === 'info') {
                            const client = JSON.parse(res.message);
                            setUser(client.user);
                            setChannel(client.channelName);
                            const event = client.user.isAdmin 
                                ? EVENTS.CLIENT.REQUEST_ADMIN_INFO 
                                : EVENTS.CLIENT.REQUEST_VIEWER_INFO;
                            socket.emit(event, client, (ack) => console.log(ack));
                        }
                    });
                } else {
                    loginInfo(request);
                }

            })
            .catch(err => {
                console.log("error", err);
                setNotif(err);
            })
    }

    if (socket != null) {
        socket.on(EVENTS.SERVER.CLIENT_INFO, ({channelName, user}) => {
            setUser(user);
            setChannel(channelName);
            localStorage.setItem('email', user.email);
            localStorage.setItem('ticket', user.ticket);
        });

        socket.off(EVENTS.SERVER.CURRENT_SHOW)
            .on(EVENTS.SERVER.CURRENT_SHOW, (newShow, callback) => {
            const currShow = {...newShow, attendees: null};
            if (newShow.attendees != null) {
                currShow.attendees = new Map(Object.entries(newShow.attendees));
            }
            setShow(currShow);
            setChatRooms(newShow.rooms);
            if (callback != null) callback(socket.id);
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
            setDisconnectedInfo(msg);
            setChannel(CHANNELS.DISCONNECTED);
            socket.disconnect();
        });

        socket.off(EVENTS.SERVER.CURRENT_ROOMS)
            .on(EVENTS.SERVER.CURRENT_ROOMS, (rooms, callback) => {
            setShow({...show, rooms});
            console.log("setting rooms", rooms);
            setChatRooms(rooms);
            if (callback != null) callback(socket.id);
        });

        socket.on(EVENTS.disconnect, (msg) => {
            console.log(msg);
            setDisconnectedInfo('A network issue occurred, or you are logged in elsewhere.');
            setChannel(CHANNELS.DISCONNECTED);
        })
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
            roomName,
            setRoomName,
            clients,
            setClients,
            notif, 
            setNotif, 
            disconnectedInfo,
            loginRequest,
        }} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;