import mongoose from "mongoose";
import { RoomSchema } from "./roomSchema";

export const ShowSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    eventId: {
        type: String,
        required: true
    },
    rooms: {
        type: [RoomSchema]
    }
});

export const ShowModel = mongoose.model('Show', ShowSchema);