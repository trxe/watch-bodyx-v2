import mongoose from "mongoose";
import { ShowModel } from "./schemas/Show";
import Logger from './utils/logger';
const db_url = 'mongodb://127.0.0.1:27017';

export const mongoInit = () => {
    mongoose.connect(db_url)
        .then(() => {
            Logger.info(`MongoDB connected at ${db_url}`);
        })
        .catch(err => Logger.error(err))
}