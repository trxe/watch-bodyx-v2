import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from 'config';
import Logger from './utils/logger';
import socket from './socket';
import { mongoInit } from './mongo';

const port = config.get<number>('port');
const host = config.get<string>('host');
const corsOrigin = config.get<string>('corsOrigin');
const url = `http://${host}:${port}`;

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
    mongoInit();
});