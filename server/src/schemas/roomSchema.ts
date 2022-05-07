import mongoose from "mongoose";

export const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        dropDups: true,
    },
    url: {
        type: String,
        required: true,
    },
    isLocked: {
        type: Boolean,
        required: true,
    },
    roomName: {
        type: String,
        required: true,
        unique: true,
    }
});

export const RoomModel = mongoose.model('Room', RoomSchema);