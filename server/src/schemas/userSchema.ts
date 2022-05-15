import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    ticket: {
        type: String,
        required: true,
        unique: true,
    },
    isAdmin: {
        type: Boolean,
        required: true,
    },
    hasAttended: {
        type: Boolean,
        required: true,
    },
    eventId: {
        type: String,
        required: true,
    },
});

export const UserModel = mongoose.model('User', UserSchema);