import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from 'config';
import Logger from './utils/logger';
import socket from './socket';
import mongoose from 'mongoose';

const port = config.get<number>('port');
const host = config.get<string>('host');
const corsOrigin = config.get<string>('corsOrigin');
const url = `http://${host}:${port}`;
const db_url = 'mongodb://127.0.0.1:27017';

console.log('port', port, 'host', host);

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true
    }
});

app.get('/', (req, res) => res.send(`Server now up at ${url}`));
httpServer.listen(port, host, () => {
    Logger.info(`Server at ${url} is listening`);
    socket({ io });
    mongoose.connect(db_url)
        .then(() => {
            Logger.info(`MongoDB connected at ${db_url}`);
        })
        .catch(err => Logger.error(err))
});