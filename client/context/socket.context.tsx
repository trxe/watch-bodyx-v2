import { createContext, useContext, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios'
import EVENTS from '../config/events';
import { CHANNELS } from '../config/channels';
import { IRoom } from '../containers/Rooms';
import { createNotif, INotif } from '../containers/Snackbar';
import { Client, User } from '../containers/Clients';
import { useChatRooms } from './chats.context';
import { useRouter } from 'next/router';
import { CLIENT_ROUTES, SERVER_ROUTES } from '../config/routes';
import { LOCATIONS } from '../config/global_settings';

/**
 * redirect: {location, data, ack?}
 */
interface Response {
    responseType: 'redirect' | 'ack'
    body: Object // ack, dst, channel, tempUser, replaceClient
}

const emptyShow = {
    name: '',
    eventId: '', 
    isOpen: false,
    rooms: [],
    attendees: new Map<string, User>(),
}

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
        isAdmin: boolean,
        eventIds: Array<string>,
        replacementTickets?: Array<string>
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
    clientsList?: Array<Client>
    notif?: INotif
    setNotif: Function
    selectedClient?: Client
    setSelectedClient: Function
    connectionState: 'connected' | 'reconnecting' | 'disconnected' | ''
    setConnectionState: Function,
    loginRequest: Function
    register: Function
    verify: Function
    regenVerify: Function
    createAccount: Function
    changePassword: Function
    loadStartTime: Function
    viewersTotal: number
    viewersPresent: number
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
    setSelectedClient: () => false,
    connectionState: '',
    setConnectionState: () => false,
    loginRequest: () => false,
    register: () => false,
    verify: () => false,
    regenVerify: () => false,
    createAccount: () => false,
    changePassword: () => false,
    loadStartTime: () => false,
    viewersPresent: 0,
    viewersTotal: 0,
});

/* Every Context object comes with a Provider React component 
 * that allows consuming components to subscribe to context changes.
 */
const SocketsProvider = (props: any) => {
    const [user, setUser] =  useState(null);
    const [channel, setChannel] = useState(null);
    const [roomName, setRoomName] = useState(null);
    const [show, setShow] = useState(emptyShow);
    const [notif, setNotif] =  useState(null);
    const [viewersTotal, setViewersTotal] = useState(0);
    const [viewersPresent, setViewersPresent] = useState(0);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [selectedClient, setSelectedClient] = useState(null);
    const {setChatRooms} = useChatRooms();

    const [clientsMap, setClientsMap] = useState(new Map<string, Client>());
    const [clientsList, setClientsList] = useState(new Array<Client>());

    const selectClient = (ticket: string) => {
        setSelectedClient(clientsMap.get(ticket));
    }

    const loginInfo = (request, onComplete) => {
        socket.emit(EVENTS.CLIENT.LOGIN, request, 
            (res) => { 
                if (res.messageType === 'warning' || res.messageType === 'error') {
                    setNotif(res); 
                    onComplete();
                } else if (res.messageType === 'info') {
                    const client = JSON.parse(res.message);
                    setUser(client.user);
                    setChannel(client.channelName);
                    const event = client.user.isAdmin 
                        ? EVENTS.CLIENT.REQUEST_ADMIN_INFO 
                        : EVENTS.CLIENT.REQUEST_VIEWER_INFO;
                    socket.emit(event, client, ack => {
                        setNotif(ack);
                        onComplete();
                    });
                }
            });
    };

    const register = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.REGISTER_TICKET, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') {
                    setNotif(body);
                    onComplete();
                }
                if (responseType !== 'redirect') return;
                const {ack, channel, dst, tempUser} = body;
                if (ack) setNotif(ack);
                if (tempUser) setUser(tempUser);
                onComplete(dst);
                if (channel) setChannel(channel);
            });
    };

    const createAccount = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.CREATE_ACCOUNT, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') {
                    setNotif(body);
                    onComplete();
                }
                if (responseType !== 'redirect') return;
                const {ack, channel, dst, tempUser} = body;
                if (ack) setNotif(ack);
                if (tempUser) setUser(tempUser);
                onComplete(dst);
                if (channel) setChannel(channel);
            });
    };

    const verify = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.VERIFY, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') {
                    setNotif(body);
                    onComplete();
                }
                if (responseType !== 'redirect') return;
                const {ack, channel, dst, user} = body;
                if (ack) setNotif(ack);
                // if user exists, set user, otherwise remove
                setUser(user);
                onComplete(dst);
                if (channel) setChannel(channel);
            });
    }

    const regenVerify = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.REGEN_VERIFY, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') {
                    setNotif(body);
                    onComplete();
                }
                if (responseType !== 'redirect') return;
                const {ack, channel, user} = body;
                if (ack) setNotif(ack);
                if (user) setUser(user);
                onComplete();
                if (channel) setChannel(channel);
            });
    }

    const changePassword = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.CHANGE_PASSWORD, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') setNotif(body);
                if (responseType !== 'redirect') return;
                const {ack, channel, dst} = body;
                if (ack) setNotif(ack);
                onComplete(dst);
                if (channel) setChannel(channel);
            });
    }

    const loginRequest = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.LOGIN, request)
            .then(({data}) => {
                const {responseType, body} = data;
                if (responseType === 'ack') {
                    setNotif(body);
                    onComplete();
                }

                if (responseType !== 'redirect') return;

                const {ack, channel, user, dst, tempUser, replaceRequest} = body;
                if (ack) setNotif(ack);
                if (user) setUser(user);
                if (channel) setChannel(channel);

                // For successfully connected
                setConnectionState('connected');
                // Initialize socket
                socket = io(process.env.NEXT_PUBLIC_URL, {reconnection: false});
                if (replaceRequest) {
                    socket.emit(EVENTS.CLIENT.REPLACE_CLIENT, replaceRequest, (res) => {
                        if (res.messageType === 'warning' || res.messageType === 'error') {
                            setNotif(res); 
                            onComplete(dst);
                        } else if (res.messageType === 'info') {
                            const client = JSON.parse(res.message);
                            setUser(client.user);
                            setChannel(client.channelName);
                            const event = client.user.isAdmin 
                                ? EVENTS.CLIENT.REQUEST_ADMIN_INFO 
                                : EVENTS.CLIENT.REQUEST_VIEWER_INFO;
                            socket.emit(event, client, () => onComplete(dst));
                        }
                    });
                } else if (tempUser) {
                    loginInfo(tempUser, () => onComplete(dst));
                }
            })
            .catch(err => {
                if (err.code === 'ERR_NETWORK') {
                    setNotif(createNotif('error', err.message, 'Please check your internet connection'));
                } else {
                    setNotif(createNotif('error', err.message, ''));
                }
                onComplete();
            })
    }

    const loadStartTime = (request, onComplete) => {
        axios.post(process.env.NEXT_PUBLIC_URL + SERVER_ROUTES.LOAD_START_TIME, request)
            .then(({data}) => {
                if (data.responseType == 'ack') {
                    console.log(data);
                    console.log(data.body);
                    onComplete(data.body);
                }
            });
    }

    if (socket != null) {
        socket.on(EVENTS.SERVER.CLIENT_INFO, ({channelName, user}) => {
            setUser(user);
            setChannel(channelName);
            localStorage.setItem('email', user.email);
        });

        // Admin show info
        socket.off(EVENTS.SERVER.CURRENT_SHOW)
            .on(EVENTS.SERVER.CURRENT_SHOW, (newShow, callback) => {
            const currShow = {...newShow, attendees: null};
            if (newShow.attendees != null) {
                currShow.attendees = new Map(Object.entries(newShow.attendees));
                const attendeesList = Object.values(newShow.attendees).filter((a: User) => !a.isAdmin);
                setViewersTotal(attendeesList.length);
                setViewersPresent(attendeesList.filter((a: User) => a.isPresent).length);
            }
            setShow(currShow);
            setChatRooms(newShow.rooms);
            if (callback != null) callback(socket.id);
        });

        // Admin control of clients
        socket.off(EVENTS.SERVER.CURRENT_CLIENTS).on(EVENTS.SERVER.CURRENT_CLIENTS, (newClientList, callback) => {
            // console.log("received list", newClientList);
            newClientList.forEach(client => {
                clientsMap.set(client.user.ticket, client);
            });
            setClientsList(newClientList);
            setViewersPresent(newClientList.filter((a: Client) => a.user.isAdmin).length);
            if (callback != null) callback(socket.id);
        });

        socket.off(EVENTS.SERVER.ADD_CLIENT).on(EVENTS.SERVER.ADD_CLIENT, (client) => {
            clientsMap.set(client.user.ticket, client);
            // console.log("clientsmap curr", client.user);
            if (show.attendees.has(client.user.ticket)) show.attendees.set(client.user.ticket, client.user);
            setClientsMap(clientsMap);
            const newClientList = Array.from(clientsMap.values());
            setClientsList(newClientList);
            setViewersPresent(newClientList.filter((a: Client) => !a.user.isAdmin).length);
        })

        socket.off(EVENTS.SERVER.DISCONNECTED_CLIENT).on(EVENTS.SERVER.DISCONNECTED_CLIENT, ({ticket, socketId}) => {
            const client = clientsMap.get(ticket);
            clientsMap.delete(ticket);
            if (show.attendees.has(client.user.ticket)) show.attendees.set(client.user.ticket, {...client.user, isPresent: false});
            setClientsMap(clientsMap);
            const newClientList = Array.from(clientsMap.values());
            setClientsList(newClientList);
            setViewersPresent(newClientList.filter((a: Client) => !a.user.isAdmin).length);
        })

        // Rooms info
        socket.off(EVENTS.SERVER.CURRENT_ROOMS)
            .on(EVENTS.SERVER.CURRENT_ROOMS, (rooms, callback) => {
            setShow({...show, rooms});
            setChatRooms(rooms);
            if (callback != null) callback(socket.id);
        });

        // Crowd control
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
            // console.log(msg);
            setConnectionState('disconnected');
            setChannel(CHANNELS.DISCONNECTED);
            socket.disconnect();
        });

        socket.off(EVENTS.SERVER.RECONNECTION)
            .once(EVENTS.SERVER.RECONNECTION, () => {
            // if alr have user, just replace my oldSocketId
            if (!user) return;
            loginInfo({ticket: user.ticket, email: user.email}, () => {});
            setConnectionState('connected');
            location.hash = '';
        });

        socket.on(EVENTS.reconnect_error, () => {
            setConnectionState('disconnected');
            location.hash = LOCATIONS.DISCONNECTED;
        })

        socket.off(EVENTS.disconnect)
            .on(EVENTS.disconnect, (reason) => {
                console.log(reason);
                setConnectionState('disconnected')
                if (reason.indexOf('disconnect') >= 0) {
                    setChannel(CHANNELS.DISCONNECTED);
                } else {
                    location.hash = LOCATIONS.DISCONNECTED;
                }
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
            roomName,
            setRoomName,
            clientsList,
            notif, 
            setNotif,
            connectionState,
            setConnectionState,
            selectedClient,
            setSelectedClient: selectClient,
            loginRequest,
            register,
            verify,
            regenVerify,
            createAccount,
            changePassword,
            loadStartTime,
            viewersPresent,
            viewersTotal
        }} 
        {...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;