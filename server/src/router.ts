import { clientForceDisconnect } from "./handlers/showHandler";
import { Ack } from "./interfaces/ack";
import { Client } from "./interfaces/client";
import Provider from "./provider";
import Logger from "./utils/logger";

const INVALID_LOGIN = new Ack('error', 'User not found', 'Invalid email/ticket.')
const UNKNOWN_ERROR = new Ack('error', 'Unknown error', 'Unknown error from server')

const registerRouting = (app) => {
    app.get('/', (req, res) => res.send('Hello World'));

    app.post('/auth', (req, res) => {
        const {email, ticket} = req.body;
        Logger.info(`Login request from ${email} (ticket: ${ticket})`);
        if (!email || !ticket) {
            res.json(INVALID_LOGIN.getJSON())
            res.end();
            return;
        } 
        Provider.findUser({email, ticket})
            .then(user => {
                if (!user) {
                    res.json(INVALID_LOGIN.getJSON())
                    res.end();
                    return;
                }
                let client: Client = Provider.getClientByTicket(ticket);
                if (client) {
                    Logger.warn(`Attempt to open multiple instances by ${user.name} (ticket: ${user.ticket})`);
                    res.json(new Ack('info', 'Disconnect this socket', client.socketId).getJSON());
                    return;
                }
                res.json(new Ack('success', 'Login successful', '').getJSON());
                res.end();
            })
            .catch((err) => {
                Logger.error(err);
                res.json(UNKNOWN_ERROR.getJSON());
                res.end();
            });
        });
}

export default registerRouting;