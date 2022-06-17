export class Response {
    type: 'redirect' | 'info' | 'ack'
    body: Object

    constructor(type: 'redirect' | 'info' | 'ack', body: Object) {
        this.type = type;
        this.body = body;
    }
}