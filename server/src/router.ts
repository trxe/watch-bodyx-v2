import axios from "axios";
import bcrypt from "bcrypt";
import { sendAuthDetailsTo, sendConfirmation, sendVerificationCode } from "./emailer";
import Verifier from "./handlers/verification";
import { Ack } from "./interfaces/ack";
import { Client } from "./interfaces/client";
import { Response } from "./interfaces/response";
import { CHANNELS } from "./protocol/channels";
import { CLIENT_ROUTES, SERVER_ROUTES } from "./protocol/routes";
import Provider from "./provider";
import { UserModel } from "./schemas/userSchema";
import Logger from "./utils/logger";
import { getOrderAttendeesURL } from "./utils/utils";

const PURCHASE_TIX_RES = new Response('ack', new Ack('error', 'Order not found', 'Purchase a ticket from our EventBrite page.').getJSON());
const INVALID_TIX_EMAIL = new Response('ack', new Ack('error', 'Email not found under order', 'Purchase a ticket from our EventBrite page.').getJSON());
const INVALID_USER_RES = new Response('ack', new Ack('error', 'User not found', 'Invalid email or missing ticket.').getJSON());
const UNKNOWN_ERROR_RES = new Response('ack', new Ack('error', 'Unknown error', 'Unknown error from server').getJSON());
const ACCOUNT_EXIST_RES = new Response('ack', new Ack('warning', 'Account already exists', 'Please log in with password').getJSON());
const INVALID_CREDS_RES = new Response('ack', new Ack('warning', 'Invalid username or password', 'Please try again').getJSON());
const PASSWORD_SET_RES = new Response('redirect', {ack: new Ack('success', 'Password set', 'Log in again with your new password.').getJSON(), dst: CLIENT_ROUTES.LOGIN, channel: CHANNELS.LOGIN_ROOM});
const CREATE_ACCT_SUCCESS_RES = new Response('redirect', {ack: new Ack('success', 'Verification success', 'Log in again to proceed.').getJSON(), dst: CLIENT_ROUTES.LOGIN, channel: CHANNELS.LOGIN_ROOM});
const TICKET_REGISTERED_RES = new Response('redirect', {ack: new Ack('success', 'Your ticket has been registered!', 'Check your email for further instructions.').getJSON(), dst: CLIENT_ROUTES.LOGIN});
const VERIFY_REQUIRED_RES = new Response('redirect', {ack: new Ack('warning', 'Please enter the verification code sent to your email.').getJSON(), channel: CHANNELS.VERIFY});

const NEW_PASSWORD_ACK = new Ack('warning', 'Set new password now.');
const REPLACE_CLIENT_ACK = new Ack('warning', 'Multiple instances detected', 'You have been logged out of your other device with BODYX logged in.');

const SALT_ROUNDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

const createPasswordForUser = async (email: string, password: string) => {
    const user = await UserModel.findOne({email});
    if (!user) {
        throw `User ${email} not found`;
    }
    user.passwordHash = await hashPassword(password);
    user.save();
    Logger.info(`Changed password successfully for ${email}`);
}

const createTempUser = (attendeeFound, eventId: string) => {
    return {
        name: attendeeFound.profile.name,
        email: attendeeFound.profile.email,
        ticket: attendeeFound.id,
        firstName: attendeeFound.profile.first_name,
        isAdmin: false,
        eventIds: [eventId],
    };
}

const createUserInDatabase = async (name: string, email: string, ticket: string, firstName: string, eventIds: Array<string>, password: string) => {
    await UserModel.create({
        name, email, ticket, firstName, isAdmin: false, eventIds,
        passwordHash: await hashPassword(password),
        isPresent: false, hasAttended: false
    }, (err, res) => {
        Logger.info('User created', res);
    });
}

const createOrModifyReplacements = async (emails: Array<string>, tickets:Array<string>, newEventId: string) => {
    const foundUsers = await UserModel.find({email: {$in : emails}});
    console.log('foundUsers', foundUsers);
    let modifiedUsersEmails = new Set<string>();
    foundUsers.forEach(user => {
        user.eventIds = [...user.eventIds, newEventId];
        user.save();
        modifiedUsersEmails.add(user.email)
        Logger.info('User updated with event', user);
    })
    emails.forEach((email, idx) => {
        if (modifiedUsersEmails.has(email)) return;
        UserModel.create({
            email, ticket: tickets[idx], eventIds: [newEventId],
            name: email, firstName: email.substring(0, email.indexOf('@')),
            isAdmin: false, isPresent: false, hasAttended: false
        }, (err, res) => {
            if (err) throw err;
            Logger.info(`User created ${res}`);
            sendAuthDetailsTo(email, tickets[idx]);
        });
    })
}

const authUser = (res, user, password: string) => {
    // No such user
    if (!user) {
        Logger.info('User not found.');
        res.json(INVALID_USER_RES)
        res.end();
    // Wrong password (equals to ticket)
    } else if (!user.passwordHash && user.ticket !== password) {
        console.log(user);
        Logger.info(`Wrong initial password for ${user.name} (correct is ${user.ticket}, entered is ${password}).`);
        res.json(INVALID_CREDS_RES);
        res.end();
    // Setting new password required.
    } else if (!user.passwordHash && user.ticket === password) {
        Logger.warn(`Require ${user.name} to set new password.`);
        res.json(new Response('redirect', {ack: NEW_PASSWORD_ACK, channel: CHANNELS.CHANGE_PASSWORD, user}))
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
                    res.json(new Response('redirect', {ack: REPLACE_CLIENT_ACK, dst: CLIENT_ROUTES.HOME, replaceRequest}))
                    res.end();
                    return;
                }
                res.json(new Response('redirect', {dst: CLIENT_ROUTES.HOME, tempUser}))
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
    const loginPOST = (req, res) => {
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
    }

    const registerPOST = (req, res) => {
        const {email, orderId} = req.body;
        Logger.info(`Account creation request from ${email} (order: ${orderId})`);
        if (!email || !orderId) {
            res.json(INVALID_USER_RES);
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
            // No such email under order
            if (attendeesFound.length == 0) {
                res.json(INVALID_TIX_EMAIL);
                res.end();
                return;
            }
            const attendee = attendeesFound[0]
            const replacementTickets = attendeesFound.map(attendee => attendee.id).filter((tix, idx) => idx > 0);
            let isAccountCreated = false;
            let isDups = false;
            let tempUser;
            UserModel.findOne({email: attendee.profile.email}, (err, user) => {
                if (err) throw err;
                // if account exists already
                if (user) {
                    isAccountCreated = true;
                    const hasEventId = user.eventIds.find(id => id === eventId) != null;
                    if (hasEventId) {
                        res.json(ACCOUNT_EXIST_RES);
                        res.end();
                        return;
                    } else {
                        user.eventIds = [...user.eventIds, eventId];
                    }
                // account doesn't exist yet
                } else {
                    tempUser = createTempUser(attendeesFound[0], eventId);
                }
                if (attendeesFound.length > 1) isDups = true;
                if (isAccountCreated && !isDups) {
                    user.save();
                    res.json(TICKET_REGISTERED_RES);
                    res.end();
                } else if (isAccountCreated && isDups) {
                    res.json(new Response('redirect', {
                        channel: CHANNELS.REPLACE_ACCOUNTS,
                        tempUser: {...user, replacementTickets},
                    }));
                } else if (!isAccountCreated) {
                    res.json(new Response('redirect', {
                        channel: CHANNELS.CREATE_ACCOUNT,
                        tempUser: {...tempUser, replacementTickets},
                    }));
                    res.end();
                }
            });
        }).catch(err => {
            Logger.error(err);
            // Order is not found.
            res.json(PURCHASE_TIX_RES);
            res.end();
        });
    };

    const createAccountPOST = (req, res) => {
        const {user, password, replacements, newEventId} = req.body;
        const emails = replacements.map(r => r.email);
        for (let i = 0; i < emails.length; i++) {
            const email = emails[i].trim();
            if (email === user.email) {
                res.json(new Response('ack', new Ack('error', 'Make sure none of the invited emails are the same as your own.')));
                res.end();
                return;
            } else if (!EMAIL_REGEX.test(email)) {
                res.json(new Response('ack', new Ack('error', `Invalid email ${email} detected.`)));
                res.end();
                return;
            }
        }
        const action = (res) => {
            if (user && password && user.email) {
                Logger.info(`Setting password for ${user.email}`);
                createUserInDatabase(user.name, user.email, user.ticket, 
                    user.firstName, user.eventIds, password);
            } 
            if (replacements && replacements.length > 0 && newEventId)  {
                const tickets = replacements.map(r => r.ticket.trim());
                const emails = replacements.map(r => r.email.trim());
                createOrModifyReplacements(emails, tickets, newEventId);
            }
            res.json(CREATE_ACCT_SUCCESS_RES);
            res.end();
        }
        const code = Verifier.generateAndSetVerification(user.email, action);
        sendVerificationCode(user.email, code).then(success => {
            res.json(success ? VERIFY_REQUIRED_RES : UNKNOWN_ERROR_RES)
            res.end();
        }).catch(err => {
            Logger.error(err);
            res.json(new Response('ack', new Ack('error', err)));
            res.end();
        });
    }

    const verifyPOST = (req, res) => {
        const {email, code} = req.body;
        if (!email || !code) {
            res.json(UNKNOWN_ERROR_RES)
            res.end();
            return;
        } 
        try {
            Verifier.verifyCode(email, code, res);
        } catch (err) {
            res.json(new Response('ack', new Ack('error', err)));
            res.end();
            Logger.error(err);
        }
    };

    const regenVerifyPOST = (req, res) => {
        const {email} = req.body;
        if (!email) {
            res.json(UNKNOWN_ERROR_RES)
            res.end();
            return;
        }
        try {
            const code = Verifier.regenerateVerification(email);
            sendVerificationCode(email, code).then(success => {
                res.json(success ? VERIFY_REQUIRED_RES : UNKNOWN_ERROR_RES)
                res.end();
            })
            Logger.info(`Generated new code for ${email}`);
        } catch (err) {
            res.json(new Response('ack', new Ack('error', err)));
            res.end();
            Logger.error(err);
        }
    }

    const changePasswordPOST = (req, res) => {
        const {email, password} = req.body;
        const action = (res) => {
            if (!email || !password) {
                res.json(UNKNOWN_ERROR_RES)
                res.end();
                return;
            } 
            Logger.info(`Changing password for ${email}`);
            createPasswordForUser(email.trim(), password.trim()).then(() => {
                res.json(PASSWORD_SET_RES);
                res.end();
            }).catch(err => {
                Logger.error(err);
                res.json(UNKNOWN_ERROR_RES);
                res.end();
            });
        }
        const code = Verifier.generateAndSetVerification(email, action);
        sendVerificationCode(email, code).then(success => {
            res.json(success ? VERIFY_REQUIRED_RES : UNKNOWN_ERROR_RES)
            res.end();
        }).catch(err => {
            Logger.error(err);
            res.json(new Response('ack', new Ack('error', err)));
            res.end();
        });
    }

    app.get('/', (req, res) => res.send('Hello World'));
    app.get(SERVER_ROUTES.REGISTER, (req, res) => res.send('Create Account (provide {email, eventId}), \
        if user found will create account and send password'))

    app.post(SERVER_ROUTES.REGISTER, registerPOST);

    app.get(SERVER_ROUTES.LOGIN, (req, res) => res.send('Authentication (provide {email, ticket})'));

    app.post(SERVER_ROUTES.LOGIN, loginPOST);

    app.post(SERVER_ROUTES.CREATE_ACCOUNT, createAccountPOST);

    app.post(SERVER_ROUTES.VERIFY, verifyPOST);

    app.post(SERVER_ROUTES.REGEN_VERIFY, regenVerifyPOST);
    
    app.get(SERVER_ROUTES.CHANGE_PASSWORD, (req, res) => res.send('Reset password (provide {email, password})'));

    app.post(SERVER_ROUTES.CHANGE_PASSWORD, changePasswordPOST);
}

export default registerRouting;