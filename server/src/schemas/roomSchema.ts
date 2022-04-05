import mongoose from "mongoose";

export const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    isLocked: {
        type: Boolean,
        required: true,
    },
    chatRoomName: {
        type: String,
        required: true,
    }
});

export const RoomModel = mongoose.model('Room', RoomSchema);