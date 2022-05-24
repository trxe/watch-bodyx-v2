import axios from "axios";
import bcrypt from "bcrypt";
import { Ack } from "./interfaces/ack";
import { Client } from "./interfaces/client";
import { User } from "./interfaces/users";
import Provider from "./provider";
import { UserModel } from "./schemas/userSchema";
import Logger from "./utils/logger";

const INVALID_LOGIN = new Ack('error', 'User not found', 'Invalid email/ticket.')
const UNKNOWN_ERROR = new Ack('error', 'Unknown error', 'Unknown error from server')
const SALT_ROUNDS = 10;

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

const authUser = (res, user, password: string) => {
    if (!user) {
        Logger.info('User not found.');
        res.json(INVALID_LOGIN.getJSON())
        res.end();
    } else if (!user.passwordHash && user.ticket !== password) {
        console.log(user);
        Logger.info(`Wrong initial password for ${user.name} (correct is ${user.ticket}, entered is ${password}).`);
        res.json(new Ack('error', 'Invalid password.').getJSON());
        res.end();
    } else if (!user.passwordHash && user.ticket === password) {
        Logger.warn(`Require ${user.name} to set new password.`);
        res.json(new Ack('warning', 'Set new password now.', JSON.stringify(user)).getJSON());
        res.end();
    } else {
        bcrypt.compare(password, user.passwordHash, (err, match) => {
            if (match) {
                Logger.info(`Correct password for ${user.name}.`);
                let tempUser = {email: user.email, ticket: user.ticket};
                let client: Client = Provider.getClientByTicket(user.ticket);
                if (client) {
                    const replaceRequest = {...tempUser, oldSocketId: client.socketId};
                    Logger.warn(`Attempt to open multiple instances by ${user.name} (ticket: ${user.ticket})`);
                    res.json(new Ack('info', 'Disconnect this socket and login from current socket', JSON.stringify(replaceRequest)).getJSON());
                    res.end();
                    return;
                }
                res.json(new Ack('success', 'Logging in...', JSON.stringify(tempUser)).getJSON());
                res.end();
            } else {
                Logger.info(`Wrong password for ${user.name}.`);
                res.json(new Ack('error', 'Invalid password.').getJSON());
                res.end();
            }
        });
    }
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
        UserModel.findOne({email, eventId})
        .then(value => {
            if (value) {
                res.json(new Ack('warning', 'Account already exists', 'Please log in with password').getJSON());
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
                    createUser(res, attendeeFound, eventId);
                } else {
                    res.json(new Ack('error', 'Attendee not found', 'Register at ...').getJSON());
                    res.end();
                }
            }).catch(err => {
                res.json(new Ack('error', 'Event does not exist'));
            });
        });
    })

    app.get('/auth', (req, res) => res.send('Authentication (provide {email, ticket})'));

    app.post('/auth', (req, res) => {
        const {email, password} = req.body;
        Logger.info(`Login request from ${email}.`);
        if (!email || !password) {
            res.json(INVALID_LOGIN.getJSON())
            res.end();
            return;
        } 
        UserModel.findOne({email}, (err, user) => {
            if (err) {
                Logger.error(err);
                res.json(UNKNOWN_ERROR.getJSON());
                res.end();
                return;
            }
            authUser(res, user, password);
        })
    });
    
    app.get('/change-password', (req, res) => res.send('Reset password (provide {email, password})'));

    app.post('/change-password', (req, res) => {
        const {email, password} = req.body;
        Logger.info(`Changing password for ${email}`);
        if (!email || !password) {
            res.json(INVALID_LOGIN.getJSON())
            res.end();
            return;
        } 
        UserModel.findOne({email}, (err, user) => {
            if (err) {
                Logger.error(err);
                return;
            }
            bcrypt.genSalt(SALT_ROUNDS, (err, salt) => {
                if (err) {
                    Logger.error(err);
                    return;
                }
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        Logger.error(err);
                        return;
                    }
                    Logger.info(`Changed password successfully for ${email}`);
                    user.passwordHash = hash;
                    user.save();
                    res.json(new Ack('success', 'Password set', 'Log in again with your new password.'));
                    res.end();
                })
            });
        })
    });
}

export default registerRouting;