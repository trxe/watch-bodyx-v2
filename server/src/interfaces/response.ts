import { Ack } from "./ack";

export class Response {
    responseType: 'redirect' | 'ack'
    body: Object

    constructor(responseType: 'redirect' | 'ack', body: Object) {
        this.responseType = responseType;
        this.body = body;
    }
}