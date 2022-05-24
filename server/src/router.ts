import axios from "axios";
import { clientForceDisconnect } from "./handlers/showHandler";
import { Ack } from "./interfaces/ack";
import { Client } from "./interfaces/client";
import Provider from "./provider";
import { UserModel } from "./schemas/userSchema";
import Logger from "./utils/logger";

const INVALID_LOGIN = new Ack('error', 'User not found', 'Invalid email/ticket.')
const UNKNOWN_ERROR = new Ack('error', 'Unknown error', 'Unknown error from server')

const getEventBriteURL = (eventId: string): string => `https://www.eventbriteapi.com/v3/events/${eventId}/attendees`;

const createUser = (res, attendeeFound, eventId: string) => {
    UserModel.create({
        name: attendeeFound.profile.name,
        email: attendeeFound.profile.email,
        ticket: attendeeFound.id,
        firstName: attendeeFound.profile.first_name,
        isAdmin: false,
        isPresent: false,
        hasAttended: false,
        eventId,
    }).then(() => {
        Logger.info(`Attendee ${attendeeFound.profile.name} created`);
        res.json(new Ack('success', 'Attendee found, login with password', attendeeFound.id).getJSON());
        res.end();
    }).catch((err) => Logger.error(err));
}

const registerRouting = (app) => {
    app.get('/', (req, res) => res.send('Hello World'));
    app.get('/create-account', (req, res) => res.send('Create Account (provide {email, eventId}), \
        if user found will create account and send password'))

    app.post('/create-account', (req, res) => {
        const {email, eventId} = req.body;
        Logger.info(`Account creation request from ${email} (event: ${eventId})`);
        if (!email || !eventId) {
            res.json(INVALID_LOGIN.getJSON())
            res.end();
            return;
        } 
        axios.get(getEventBriteURL(eventId),
            {headers: {
                'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
                'Content-Type': 'application/json',
            }}
        ).then((eventbrite) => {
            const attendeeFound = eventbrite.data.attendees.find(attendee => attendee.profile.email === email);
            if (attendeeFound) {
                UserModel.findOne({ticket: attendeeFound.id})
                .then(value => {
                    if (value) {
                        res.json(new Ack('warning', 'Account already exists', 'Please log in with password').getJSON());
                        res.end();
                        return;
                    }
                    createUser(res, attendeeFound, eventId);
                });
            } else {
                res.json(new Ack('error', 'Attendee not found', 'Register at ...').getJSON());
                res.end();
            }
        }).catch(err => {
            res.json(new Ack('error', 'Event does not exist'));
        })
        ;
    })

    app.get('/auth', (req, res) => res.send('Authentication (provide {email, ticket})'));

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