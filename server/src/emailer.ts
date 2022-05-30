import nodemailer from 'nodemailer';
import Logger from './utils/logger';
import * as dotenv from 'dotenv';

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

export const sendAuthDetailsTo = async (receiver: string, password: string): Promise<boolean> => {
    if (!transporter) {
        Logger.error('Email server is not setup');
        return false;
    }
    try {
        let info = await transporter.sendMail({
            from: `"${sender}" ${transporter.options.auth.user}`, // sender address
            to: receiver, // list of receivers
            subject: "Your BODYX Authentication Details", // Subject line
            text: `Username: ${receiver}, Password: ${password}`, // plain text body
            html: `
                <h1>You're almost ready to experience BODYX!</h1>
                <p>Log into <a href="watch.bodyx.live">watch.bodyx.live</a> with the following credentials. You will be prompted to change your password.</p>
                <p><b>Username</b>: ${receiver}</p>
                <p><b>Password</b>: ${password}</p>
            `, // html body
        });
        Logger.info(`[${info.response}] Message sent: ${info.messageId}`);
    } catch (err) {
        Logger.error(`Error sending mail`);
        return false;
    }
}