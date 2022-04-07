const EVENTS = {
    connect: 'connect',
    disconnect: 'disconnect',
    CLIENT: {
        LOGIN: 'LOGIN',
        UPDATE_SHOW: 'UPDATE_SHOW',
        JOIN_ROOM: 'JOIN_ROOM',
        CREATE_ROOM: 'CREATE_ROOM',
        UPDATE_ROOM: 'UPDATE_ROOM',
        DELETE_ROOM: 'DELETE_ROOM'
        // SEND_ROOM_MESSAGE: 'SEND_ROOM_MESSAGE',
    },
    SERVER: {
        INVALID_LOGIN: 'INVALID_LOGIN',
        CLIENT_INFO: 'CLIENT_INFO',
        CURRENT_SHOW: 'CURRENT_SHOW',
        CURRENT_ROOMS: 'CURRENT_ROOMS',
        ATTENDEE_LIST: 'ATTENDEE_LIST',
        USER_LIST: 'USER_LIST',
        GENERIC_ERROR: 'GENERIC_ERROR',
        FORCE_JOIN: 'FORCE_JOIN',
        // ROOMS: 'ROOMS',
        // JOINED_ROOM: 'JOINED_ROOM',
        // ROOM_MESSAGE: 'ROOM_MESSAGE',
    }
};

export default EVENTS