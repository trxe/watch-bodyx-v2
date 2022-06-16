export class Response {
    status: number
    type: 'redirect' | 'info' | 'ack'
    body: Object

    constructor(status: number, type: 'redirect' | 'info' | 'ack', body: Object) {
        this.status = status;
        this.type = type;
        this.body = body;
    }
}