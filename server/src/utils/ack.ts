export const STATUS = {
    INVALID_LOGIN: {
        messageType: 'error',
        title: 'Wrong ticket ID',
        message: 'Invalid login credentials.',
    }
}

export interface INotif {
    messageType: 'error' | 'info' | 'warning' | 'success',
    title: string,
    message: string,
}