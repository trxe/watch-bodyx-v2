const EVENTS = {
    connect: 'connect',
    disconnect: 'disconnect',
    CLIENT: {
        LOGIN: 'LOGIN',
        RECONNECT: 'RECONNECT',
        REPLACE_CLIENT: 'REPLACE_CLIENT',
        REQUEST_ADMIN_INFO: 'REQUEST_ADMIN_INFO',
        REQUEST_VIEWER_INFO: 'REQUEST_VIEWER_INFO',
        LOGOUT: 'LOGOUT',
        GET_INFO: 'GET_INFO',
        UPDATE_SHOW: 'UPDATE_SHOW',
        JOIN_ROOM: 'JOIN_ROOM',
        JOIN_CHANNEL: 'JOIN_CHANNEL',
        CREATE_ROOM: 'CREATE_ROOM',
        UPDATE_ROOM: 'UPDATE_ROOM',
        DELETE_ROOM: 'DELETE_ROOM',
        TOGGLE_SHOW_START: 'TOGGLE_SHOW_START',
        MOVE_SOCKET_TO: 'MOVE_SOCKET_TO',
        NEW_MESSAGE: 'NEW_MESSAGE',
        PIN_MESSAGE: 'PIN_MESSAGE',
        ADMIN_TOGGLE_AUDIENCE_CHAT: 'ADMIN_TOGGLE_AUDIENCE_CHAT',
    },
    SERVER: {
        INVALID_LOGIN: 'INVALID_LOGIN',
        CLIENT_INFO: 'CLIENT_INFO',
        CURRENT_SHOW: 'CURRENT_SHOW',
        CURRENT_ROOMS: 'CURRENT_ROOMS',
        CURRENT_CLIENTS: 'CURRENT_CLIENTS',
        ADD_CLIENT: 'ADD_CLIENT',
        DISCONNECTED_CLIENT: 'DISCONNECTED_CLIENT',
        FORCE_JOIN_CHANNEL: 'FORCE_JOIN_CHANNEL',
        FORCE_JOIN_ROOM: 'FORCE_JOIN_ROOM',
        FORCE_DISCONNECT: 'FORCE_DISCONNECT',
        DELIVER_MESSAGE: 'DELIVER_MESSAGE',
        TOGGLE_AUDIENCE_CHAT: 'TOGGLE_AUDIENCE_CHAT'
    }
};


export default EVENTS;