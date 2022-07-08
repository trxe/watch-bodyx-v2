import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    // Name of the attendee.
    // If sent by invite, it is the same as email by default.
    name: {
        type: String,
        required: true,
    },
    // Attendee's email. 
    // Is unique entry username.
    email: {
        type: String,
        required: true,
        unique: true,
    },
    // First name of the attendee, to use to address the viewer.
    // If sent by invite, it is the same as email without domain (@...) by default.
    firstName: {
        type: String,
        required: true,
    },
    // First ticket ever purchased by user.
    ticket: {
        type: String,
        required: true,
        unique: true,
    },
    // Hashed password.
    passwordHash: {
        type: String,
    },
    // Is this user an admin?
    isAdmin: {
        type: Boolean,
        required: true,
    },
    // Is this user logged in?
    isPresent: {
        type: Boolean,
        required: true,
    },
    // Has this user attended?
    hasAttended: {
        type: Boolean,
        required: true,
    },
    // List of ids for the EventBrite events this user should have access to.
    eventIds: {
        type: [String],
        required: true,
        default: [],
    },
});

export const UserModel = mongoose.model('User', UserSchema);