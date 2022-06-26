import nodemailer from 'nodemailer';
import Logger from './utils/logger';
import * as dotenv from 'dotenv';
import { P } from 'pino';

dotenv.config();

let transporter;
const sender: string = "BODYX Ticketing";

export const emailInit = async () => {
    try {
        transporter = nodemailer.createTransport({
            name: process.env.SMTP_HOST,
            host: process.env.SMTP_HOST,
            port: 587,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PWD,
            },
            tls: {
                rejectUnauthorized: false,
                ciphers:'SSLv3'
            }
        });

        transporter.verify(function (error, success) {
            if (error) {
                Logger.error(error);
            } else {
                Logger.info(`Email set up with username: ${transporter.options.auth.user}`);
            }
        });
    } catch (err) {
        Logger.error(err);
    }
}

export const sendConfirmation = async (receiver: string): Promise<boolean> => {
    if (!transporter) {
        Logger.error('Email server is not setup');
        return false;
    }
    let info = await transporter.sendMail({
        from: `"${sender}" ${transporter.options.auth.user}`, // sender address
        to: receiver, // list of receivers
        subject: "BODYX: Successful registration", // Subject line
        text: `Thanks for signing up for BODYX!`, // plain text body
        html: `
            <h1>You're almost ready to experience BODYX!</h1>
            <p>Log into <a href="watch.bodyx.live">watch.bodyx.live</a> with your new account with username ${receiver}.</p>
        `, // html body
    });
    Logger.info(`[${info.response}] Message sent: ${info.messageId}`);
    return true;
}

export const sendVerificationCode = async (receiver: string, code: string): Promise<boolean> => {
    if (!transporter) {
        Logger.error('Email server is not setup');
        return false;
    }
    let info = await transporter.sendMail({
        from: `"${sender}" ${transporter.options.auth.user}`, // sender address
        to: receiver, // list of receivers
        subject: "Verification Code", // Subject line
        text: `Your verification code is ${code}`, // plain text body
        html: `
            <h1>Your BODYX Verification Code</h1>
            <p>Your verification code is ${code}</p>
        `, // html body
    });
    Logger.info(`[${info.response}] Message sent: ${info.messageId}`);
    return true;
}