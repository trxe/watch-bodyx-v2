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
import { ModalInfo } from '../utils/modal';

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
    disconnectedInfo: string
    loginRequest: Function
    createAccount: Function
    changePassword: Function
    viewersTotal: number
    viewersPresent: number
    modal: ModalInfo
    setModal: Function
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
    disconnectedInfo: '',
    loginRequest: () => false,
    createAccount: () => false,
    changePassword: () => false,
    viewersPresent: 0,
    viewersTotal: 0,
    modal: null,
    setModal: () => false,
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
    const [modal, setModal] = useState(null);
    const [viewersTotal, setViewersTotal] = useState(0);
    const [viewersPresent, setViewersPresent] = useState(0);
    const [disconnectedInfo, setDisconnectedInfo] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const {setChatRooms} = useChatRooms();

    const [clientsMap, setClientsMap] = useState(new Map<string, Client>());
    const [clientsList, setClientsList] = useState(new Array<Client>());

    const selectClient = (ticket: string) => {
        setSelectedClient(clientsMap.get(ticket));
    }

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
    };

    const createAccount = (request) => {
        axios.post(SOCKET_URL + 'create-account', request)
            .then(({data}) => {
                console.log(data);
                if (data.messageType != null) setNotif(data);
            });
    };

    const changePassword = (request) => {
        axios.post(SOCKET_URL + 'change-password', request)
            .then(({data}) => {
                console.log(data);
                if (data.messageType != null) setNotif(data);
                if (data.messageType === 'success') {
                    setUser(null);
                    setChannel(CHANNELS.LOGIN_ROOM);
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
                } else if (data.messageType === 'warning') {
                    setNotif(createNotif('warning', 'Set a new password.', 'Log into your account again afterwards.'));
                    setUser(JSON.parse(data.message));
                    setChannel(CHANNELS.CHANGE_PASSWORD);
                    return;
                }

                socket = io(SOCKET_URL, {reconnection: false});
                if (data.messageType === 'info') {
                    const tempUserWithOldSocket = JSON.parse(data.message);
                    setNotif(createNotif('warning', 
                        'You are logged in on multiple instances',
                        'Other instances will be disconnected.'));
                    socket.emit(EVENTS.CLIENT.REPLACE_CLIENT, tempUserWithOldSocket, (res) => {
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
                } else if (data.messageType === 'success') {
                    const tempUser = JSON.parse(data.message);
                    loginInfo(tempUser);
                }

            })
            .catch(err => {
                console.log("error", err);
                setNotif(err);
            })
    }

    const disconnectedModalInfo: ModalInfo = {
        id: 'disconnected',
        title: 'Disconnected from server',
        description: 'Either the server has unexpectedly crashed, or you have lost connection.',
        buttons: [
            {label: 'Reconnect', action: () => socket.connect()}
        ]
    };

    if (socket != null) {
        socket.on(EVENTS.SERVER.CLIENT_INFO, ({channelName, user}) => {
            setUser(user);
            setChannel(channelName);
            localStorage.setItem('email', user.email);
            localStorage.setItem('ticket', user.ticket);
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
            console.log("setting rooms", rooms);
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
            console.log(msg);
            setDisconnectedInfo(msg);
            setChannel(CHANNELS.DISCONNECTED);
            socket.disconnect();
        });

        socket.on(EVENTS.connect, () => {
            // if alr have user, just replace my oldSocketId
            if (modal == disconnectedModalInfo) {
                location.hash = '';
                setModal(null);
            }
        });

        socket.off(EVENTS.disconnect)
            .on(EVENTS.disconnect, (reason) => {
                console.log(reason);
                if (reason.indexOf('disconnect') >= 0) {
                    setDisconnectedInfo('A network issue occurred, or you are logged in elsewhere.');
                    setChannel(CHANNELS.DISCONNECTED);
                } else {
                    setModal(disconnectedModalInfo);
                    location.hash = `#${disconnectedModalInfo.id}`;
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
            modal,
            setModal,
            disconnectedInfo,
            selectedClient,
            setSelectedClient: selectClient,
            loginRequest,
            createAccount,
            changePassword,
            viewersPresent,
            viewersTotal
        }} 
        {
            ...props} 
    />
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;