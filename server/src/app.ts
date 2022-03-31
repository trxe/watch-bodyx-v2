import express from 'express';
import http from 'http';
import https from 'https'
import { Server } from 'socket.io';
import cors from 'cors';
import Logger from './utils/logger';
import socket from './socket';
import fs from 'fs'
import * as dotenv from 'dotenv';
import { mongoInit } from './mongo';

dotenv.config();

const port: number = parseInt(process.env.PORT)
const host: string = process.env.HOST
const mode: string = process.env.MODE // secure or not (dev)

Logger.info(`Setting up server on port ${port}, host ${host}`);

const app = express();

const httpServer = (mode === 'secure') ? 
    https.createServer({
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
    },app) : 
    http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

app.get('/', (req, res) => res.send('Hello World'));

httpServer.listen(port, host, () => {
    Logger.info(`Listening on ${JSON.stringify(httpServer.address())}`);
    socket({ io });
    mongoInit();
});