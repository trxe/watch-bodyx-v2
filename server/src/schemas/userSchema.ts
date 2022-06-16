import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
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
    passwordHash: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        required: true,
    },
    isPresent: {
        type: Boolean,
        required: true,
    },
    hasAttended: {
        type: Boolean,
        required: true,
    },
    eventIds: {
        type: [String],
        required: true,
        default: [],
    },
});

export const UserModel = mongoose.model('User', UserSchema);