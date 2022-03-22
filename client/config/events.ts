const EVENTS = {
    connect: 'connect',
    disconnect: 'disconnect',
    CLIENT: {
        LOGIN: 'LOGIN',
        UPDATE_SHOW: 'UPDATE_SHOW',
        // CREATE_ROOM: 'CREATE_ROOM',
        // JOIN_ROOM: 'JOIN_ROOM',
        // SEND_ROOM_MESSAGE: 'SEND_ROOM_MESSAGE',
    },
    SERVER: {
        PRIVILEGE: 'PRIVILEGE',
        CURRENT_SHOW: 'CURRENT_SHOW',
        ATTENDEE_LIST: 'ATTENDEE_LIST',
        // ROOMS: 'ROOMS',
        // JOINED_ROOM: 'JOINED_ROOM',
        // ROOM_MESSAGE: 'ROOM_MESSAGE',
    }
};

export default EVENTS