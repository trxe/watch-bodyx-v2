export class Ack {
    message: string
    title: string
    messageType:  'error' | 'info' | 'warning' | 'success'

    constructor (status: 'error' | 'info' | 'warning' | 'success',
     title: string, msg?: string) {
        this.messageType = status;
        this.title = title;
        this.message = msg || '';
    }

    public getJSON(): Object {
        return {
            message: this.message, 
            title: this.title,
            messageType: this.messageType
        };
    }
}