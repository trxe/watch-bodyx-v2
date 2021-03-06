import axios from "axios";
import mongoose from "mongoose";
import { RoomModel } from "../schemas/roomSchema";
import { ShowModel } from "../schemas/showSchema";
import { UserModel } from "../schemas/userSchema";
import Logger from "../utils/logger";
import { getEventAttendeesURL } from "../utils/utils";
import { Room } from "./room";
import { User } from "./users";

export class Show {
    name: string
    eventId: string
    rooms: Room[]
    attendees: Map<string, User> // key = ticket, value = User
    isOpen: boolean
    dbShow

    constructor(name: string, eventId: string, isOpen: boolean) {
        this.name = name;
        this.eventId = eventId;
        this.isOpen = isOpen;
    }

    public async createRoom(name: string, url: string, isLocked: boolean): Promise<Room> {
        if (!this.dbShow) this.loadShow()
        const _id = new mongoose.Types.ObjectId();
        const roomName = `${_id.toString()}_ROOM`;
        const room = new RoomModel({ name, url, isLocked, _id, roomName });
        if (await this.dbShow.rooms.length == 0) {
            room.isLocked = false;
        }
        this.dbShow.rooms.push(room);
        await this.dbShow.save(err => {
            if (!err) return;
            Logger.error(err);
            throw 'Error saving room to database.';
        });
        this.rooms = this.dbShow.rooms;
        return room;
    }

    public async updateRoom(newRoom: Room): Promise<string> {
        if (!this.dbShow) this.loadShow()
        const room = await this.dbShow.rooms.id(newRoom._id);
        room.name = newRoom.name;
        room.url = newRoom.url;
        room.isLocked = newRoom.isLocked;
        room.chatRoomName = `${newRoom._id}_ROOM`;
        await this.dbShow.save(err => {
            if (!err) return;
            Logger.error(err);
            throw 'Error saving room to database.';
        });
        this.rooms = this.dbShow.rooms;
        return newRoom._id.toString();
    }

    public async deleteRoom(_id: string): Promise<Room> {
        if (!this.dbShow) await this.loadShow()
        if (_id === this.dbShow.rooms[0]._id.toString() && this.dbShow.rooms.length > 1) {
            this.dbShow.rooms[1].isLocked = false;
            Logger.warn(`Room ${this.dbShow.rooms[1].name} is now the new main room.`);
        }
        const room = {...this.dbShow.rooms.id(_id)};
        await this.dbShow.rooms.id(_id).remove();
        await this.dbShow.save(err => {
            if (err) {
                Logger.error(err);
                throw 'Error saving room to database.';
            }
        });
        Logger.info(`Updated room list:`);
        Logger.info(this.dbShow.rooms);
        return room;
    }

    public async findRoomNameById(_id: string, defaultRoom : string): Promise<string> {
        const room = await this.dbShow.rooms.id(_id);
        return !room ? defaultRoom : room.roomName;
    }

    public async saveShow(name, eventId): Promise<string> {
        const oldEventId = this.eventId;
        this.name = name;
        if (this.eventId == eventId) return;
        this.eventId = eventId;
        if (!this.dbShow) this.loadShow()
        this.dbShow.name = name;
        this.dbShow.eventId = eventId;
        await this.dbShow.save();
        try {
            this.attendees = await this.getAttendees();
        } catch (err) { 
            Logger.error(err);
            this.attendees = null;
            throw 'Invalid Event ID';
        }
        return oldEventId;
    }

    public getJSON(): {name: string, eventId: string, isOpen: boolean, rooms: Array<Room>, attendees: Object} {
        return {
            name: this.name,
            eventId: this.eventId,
            isOpen: this.isOpen,
            rooms: this.rooms,
            attendees: !this.attendees ? new Map<string, User>() : Object.fromEntries(this.attendees),
        };
    }

    public findAttendee(ticket: string, email: string): User {
        // if no attendees list, this event is invalid. temp generate attendee
        if (!this.attendees) return null;
        if (!this.attendees.has(ticket)) return null;
        const user: User = this.attendees.get(ticket);
        if (user.email != email) return null;
        return user;
    }

    public async loadShow(): Promise<void> {
        const size = await ShowModel.count()
        if (size != 1) {
            await ShowModel.deleteMany({});
            await ShowModel.create({
                name: this.name,
                eventId: this.name,
                rooms: [],
            })
        }
        this.dbShow = await ShowModel.findOne();
        this.name = this.dbShow.name.trim();
        this.isOpen = false;
        this.eventId = this.dbShow.eventId.trim();
        this.rooms = this.dbShow.rooms;
        try {
            this.attendees = await this.getAttendees();
        } catch (err) { 
            Logger.error(err);
            this.attendees = null;
            throw 'Invalid Event ID';
        }
    }

    public setShowOpen(isShowOpen: boolean) {
        this.isOpen = isShowOpen;
    }

    async getAttendees(): Promise<Map<string, User>> {
        const attendeeMap = new Map<string, User>();
        if (!this.eventId) return;
        if (this.eventId.length == 0) return;
        await UserModel.find({"events.eventId": this.eventId}, (err, users) => {
            if (err) Logger.error(err);
            if (!users && users.length == 0) return;
            users.map(u => {
                const user = {...u._doc};
                delete user['__v'];
                delete user['_id'];
                delete user['passwordHash'];
                console.log('Attendee', user.name, user.ticket);
                attendeeMap.set(user.ticket, user)
            });
        }).clone();
        try {
            const res = await axios.get(getEventAttendeesURL(this.eventId), 
                {headers: {
                    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
                    'Content-Type': 'application/json',
                }}
            );
            Logger.info(`Attendees from new eventid ${this.eventId}.`);
            const emailsUsed: Map<string, string> = new Map<string, string>(); // hashmap for emails and corresponding ticket id.
            res.data.attendees
                .forEach(attendee => { 
                    if (attendee.cancelled) {
                        console.log('Skip Attendee', attendee.profile.name, attendee.id);
                        return;
                    }
                    UserModel.findOne({email: attendee.profile.email}, 
                    (err, result) => {
                        const {email, name, first_name} = attendee.profile;
                        if (!result && !emailsUsed.has(email)) {
                            console.log('Creating temporary attendee', email, name, first_name);
                            attendeeMap.set(attendee.id, this.generateTempAttendee(email, first_name, name));
                            emailsUsed.set(email, attendee.id);
                        } else if (result && !emailsUsed.has(email)) {
                            emailsUsed.set(email, attendee.id);
                        } else if (emailsUsed.has(email)) {
                            Logger.warn(`Duplicate attendee ${email} has already created a different account (ticket: ${emailsUsed.get(email)}).`);
                        }
                    });
                });
        } catch (err) {
            throw `Invalid Event ID (${this.eventId}) (EventBrite cannot find this event).`
        }
        return attendeeMap;
    }

    generateTempAttendee(email, name, firstName): User {
        return { email, name, firstName, ticket: '', isAdmin: false, isPresent: false, hasAttended: false , eventIds: [this.eventId]};
    }
}