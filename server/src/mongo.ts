import mongoose from "mongoose";
import Logger from './utils/logger';
import * as dotenv from 'dotenv';
import { UserModel } from "./schemas/userSchema";

dotenv.config();

export const mongoInit = () => {
    mongoose.connect(process.env.DB_URL, {
        dbName: process.env.DB_NAME,
    })
    .then(() => {
        Logger.info(`MongoDB connected at ${process.env.DB_URL}`);
    })
    .catch(err => Logger.error(err));
}