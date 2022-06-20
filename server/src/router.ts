import axios from "axios";
import bcrypt from "bcrypt";
import { sendAuthDetailsTo } from "./emailer";
import { Ack } from "./interfaces/ack";
import { Client } from "./interfaces/client";
import { Response } from "./interfaces/response";
import Provider from "./provider";
import { UserModel } from "./schemas/userSchema";
import Logger from "./utils/logger";
import { getOrderAttendeesURL } from "./utils/utils";

const PURCHASE_TIX_RES = new Response('ack', new Ack('error', 'Order not found', 'Purchase a ticket from our EventBrite page.').getJSON());
const INVALID_TIX_EMAIL = new Response('ack', new Ack('error', 'Email not found under order', 'Purchase a ticket from our EventBrite page.').getJSON());
const INVALID_USER_RES = new Response('ack', new Ack('error', 'User not found', 'Invalid email or missing ticket.').getJSON());
const UNKNOWN_ERROR_RES = new Response('ack', new Ack('error', 'Unknown error', 'Unknown error from server').getJSON());
const ACCOUNT_CREATED_RES = new Response('ack', new Ack('success', 'Account successfully created', 'Check your email for further instructions.').getJSON());
const PASSWORD_SET_RES = new Response('ack', new Ack('success', 'Password set', 'Log in again with your new password.').getJSON());
const ACCOUNT_EXIST_RES = new Response('ack', new Ack('warning', 'Account already exists', 'Please log in with password').getJSON());
const INVALID_CREDS_RES = new Response('ack', new Ack('warning', 'Invalid username or password', 'Please try again').getJSON());

const NEW_PASSWORD_ACK = new Ack('warning', 'Set new password now.');
const REPLACE_CLIENT_ACK = new Ack('warning', 'Multiple instances detected', 'You have been logged out of your other device with BODYX logged in.');

const SALT_ROUNDS = 10;

const ROUTES = {
    HOME: '/',
    LOGIN: '/auth',
    REGISTER: '/register',
    CHANGE_PASSWORD: '/change-password'
}

const createUser = (res, attendeeFound, eventId: string) => {
    UserModel.create({
        name: attendeeFound.profile.name,
        email: attendeeFound.profile.email,
        ticket: attendeeFound.id,
        firstName: attendeeFound.profile.first_name,
        isAdmin: false,
        isPresent: false,
        hasAttended: false,
        eventIds: [eventId],
    }).then(async () => {
        Logger.info(`Attendee ${attendeeFound.profile.name} created`);
        sendAuthDetailsTo(attendeeFound.profile.email, attendeeFound.id)
            .then(() =>{
                res.json(ACCOUNT_CREATED_RES);
                res.end();
            })
            .catch(err => {
                UserModel.deleteOne({email: attendeeFound.profile.email});
                Logger.error(err);
                res.json(UNKNOWN_ERROR_RES);
                res.end();
            });
    }).catch((err) => Logger.error(err));
}

const authUser = (res, user, password: string) => {
    if (!user) {
        Logger.info('User not found.');
        res.json(INVALID_USER_RES)
        res.end();
    } else if (!user.passwordHash && user.ticket !== password) {
        console.log(user);
        Logger.info(`Wrong initial password for ${user.name} (correct is ${user.ticket}, entered is ${password}).`);
        res.json(INVALID_CREDS_RES);
        res.end();
    } else if (!user.passwordHash && user.ticket === password) {
        Logger.warn(`Require ${user.name} to set new password.`);
        res.json(new Response('redirect', {ack: NEW_PASSWORD_ACK, dst: ROUTES.CHANGE_PASSWORD, user}))
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
                    res.json(new Response('redirect', {ack: REPLACE_CLIENT_ACK, dst: ROUTES.HOME, replaceRequest}))
                    res.end();
                    return;
                }
                res.json(new Response('redirect', {dst: ROUTES.HOME, tempUser}))
                res.end();
            } else {
                Logger.info(`Wrong password for ${user.name}.`);
                res.json(INVALID_CREDS_RES);
                res.end();
            }
        });
    }
}

const registerRouting = (app) => {
    app.get('/', (req, res) => res.send('Hello World'));
    app.get('/register', (req, res) => res.send('Create Account (provide {email, eventId}), \
        if user found will create account and send password'))

    app.post('/register', (req, res) => {
        const {email, orderId} = req.body;
        Logger.info(`Account creation request from ${email} (order: ${orderId})`);
        if (!email || !orderId) {
            res.json(INVALID_USER_RES);
            res.end();
            return;
        } 
        UserModel.findOne({email})
        .then(value => {
            if (value) {
                res.json(ACCOUNT_EXIST_RES);
                res.end();
                return;
            }
            axios.get(getOrderAttendeesURL(orderId.trim()),
                {headers: {
                    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
                    'Content-Type': 'application/json',
                }}
            ).then((eventbrite) => {
                const attendeesFound = eventbrite.data.attendees.filter(attendee => attendee.profile.email === email);
                const eventId = eventbrite.data.event_id;
                if (attendeesFound.length == 1) {
                    const attendee = attendeesFound[0]
                    UserModel.findOne({email: attendee.profile.email}, (err, user) => {
                        if (err) throw err;
                        if (user) {
                            user.eventIds = [...user.eventIds, eventId];
                            user.save();
                        } else {
                            createUser(res, attendee, eventId);
                        }
                    });
                } else if (attendeesFound.length > 1) {
                    // TODO
                } else {
                    res.json(INVALID_TIX_EMAIL);
                    res.end();
                }
            }).catch(err => {
                Logger.error(err);
                res.json(PURCHASE_TIX_RES);
                res.end();
            });
        });
    })

    app.get('/auth', (req, res) => res.send('Authentication (provide {email, ticket})'));

    app.post('/auth', (req, res) => {
        const {email, password} = req.body;
        Logger.info(`Login request from ${email}.`);
        if (!email || !password) {
            res.json(INVALID_USER_RES)
            res.end();
            return;
        } 
        UserModel.findOne({email}, (err, user) => {
            if (err) {
                Logger.error(err);
                res.json(UNKNOWN_ERROR_RES);
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
            res.json(UNKNOWN_ERROR_RES)
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
                    res.json(PASSWORD_SET_RES);
                    res.end();
                })
            });
        })
    });
}

export default registerRouting;