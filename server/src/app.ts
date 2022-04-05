import express from 'express';
import http from 'http';
import https from 'https'
import { Server } from 'socket.io';
import cors from 'cors';
import Logger from './utils/logger';
import fs from 'fs'
import * as dotenv from 'dotenv';
import { mongoInit } from './mongo';
import registerRouting from './router';
import Provider from './provider';
import { registerLoginHandlers } from './handlers/loginHandler';
import { registerShowHandlers } from './handlers/showHandler';

dotenv.config();

const port: number = parseInt(process.env.PORT)
const host: string = process.env.HOST
const mode: string = process.env.MODE // secure or not (dev)

Logger.info(`Setting up server on port ${port}, host ${host}`);

/* HTTP server */
const app = express();
const httpServer = (mode === 'secure') ? 
    https.createServer({
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
    },app) : 
    http.createServer(app);

registerRouting(app);

/* socket.io server */
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

/* Registering handlers on socket.io startup */
const onConnection = (socket) => {
    Logger.info(`User ${socket.id} connected`);
    registerLoginHandlers(io, socket);
    registerShowHandlers(io, socket);
}

httpServer.listen(port, host, () => {
    Logger.info(`Listening at ${JSON.stringify(httpServer.address())}`);
    mongoInit();
    Provider.loadUsers();
    Provider.init();
    io.on("connect", onConnection);
});