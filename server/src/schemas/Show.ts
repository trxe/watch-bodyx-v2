import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
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
    }
});

export const RoomModel = mongoose.model('Room', RoomSchema);

const ShowSchema = new mongoose.Schema({
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

export interface IShow {
    name: string; 
    eventId: string; 
    rooms: Array<IRoom>;
    attendees: Array<IAttendee>;
}


export interface IRoom {
    name: string;
    url:  string;
    isLocked: boolean;
    _id: string;
}

export interface IAttendee {
    ticket: string;
    first_name: string;
    last_name: string;
    email: string;
    name: string;
    addresses: {};
}