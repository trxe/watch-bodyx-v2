import mongoose from "mongoose";
import { ShowModel } from "./schemas/Show";
import Logger from './utils/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export const mongoInit = () => {
    mongoose.connect(process.env.DB_URL)
        .then(() => {
            Logger.info(`MongoDB connected at ${process.env.DB_URL}`);
        })
        .catch(err => Logger.error(err))
}