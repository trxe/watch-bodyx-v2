export const STATUS = {
    INVALID_LOGIN: {
        messageType: 'error',
        title: 'Wrong ticket ID',
        message: 'Invalid login credentials.',
    },
    INSUFFICIENT_PRIVILEGE: {
        messageType: 'error',
        title: 'Insufficient privilege rights',
        message: 'You must be an admin to perform this action.',
    },
    SESSION_EXP: {
        messageType: 'error',
        title: 'Session expired',
        message: 'Please refresh the page to continue.',
    },
}

export interface INotif {
    messageType: 'error' | 'info' | 'warning' | 'success',
    title: string,
    message: string,
}