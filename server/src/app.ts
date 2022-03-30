import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Logger from './utils/logger';
import socket from './socket';
import * as dotenv from 'dotenv';
import { mongoInit } from './mongo';

dotenv.config();

const port: number = parseInt(process.env.PORT)
const host: string = process.env.HOST

console.log('port', port, 'host', host);

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

app.get('/', (req, res) => res.send('Hello World'));

httpServer.listen(port, host, () => {
    Logger.info(`Server is listening`);
    socket({ io });
    mongoInit();
});