import axios from "axios";
import { RoomModel } from "../schemas/roomSchema";
import { ShowModel } from "../schemas/showSchema";
import Logger from "../utils/logger";
import { Room } from "./room";
import { User } from "./users";

export class Show {
    name: string
    eventId: string
    rooms: Room[]
    attendees: Map<string, User>
    dbShow

    constructor(name: string, eventId: string) {
        this.name = name;
        this.eventId = eventId;
    }

    public async createRoom(name: string, url: string, isLocked: boolean): Promise<string> {
        if (!this.dbShow) this.loadShow()
        const room = new RoomModel({ name, url, isLocked });
        this.dbShow.rooms.push(room);
        room.chatRoomName = `${room._id}_ROOM`;
        await this.dbShow.save(err => {
            if (!err) return;
            Logger.error(err);
            throw 'Error saving room to database.';
        });
        this.rooms = this.dbShow.rooms;
        return room._id.toString();
    }

    public async updateRoom(newRoom: Room): Promise<string> {
        if (!this.dbShow) this.loadShow()
        const room = await this.dbShow.rooms.id(newRoom._id);
        console.log(room);
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

    public async deleteRoom(_id: string): Promise<string> {
        if (!this.dbShow) this.loadShow()
        const room = await this.dbShow.rooms.id(_id).remove();
        Logger.info(this.dbShow.rooms);
        return _id;
    }

    public async saveShow(name, eventId): Promise<void> {
        this.name = name;
        if (this.eventId == eventId) return;
        this.eventId = eventId;
        if (!this.dbShow) this.loadShow()
        this.dbShow.name = name;
        this.dbShow.eventId = eventId;
        await this.dbShow.save();
        await this.getAttendees()
            .then(attendees => this.attendees = attendees)
            .catch(err => { 
                this.attendees = null;
                throw err;
            });
    }

    public getJSON(): {name: string, eventId: string, rooms: Array<Room>, attendees: Object} {
        return {
            name: this.name,
            eventId: this.eventId,
            rooms: this.rooms,
            attendees: !this.attendees ? null : Object.fromEntries(this.attendees),
        };
    }

    public findAttendee(ticket: string, email: string): User {
        // if no attendees list, this event is invalid. temp generate attendee
        if (!this.attendees) return this.generateAttendee(ticket, email);
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
        this.eventId = this.dbShow.eventId.trim();
        this.rooms = this.dbShow.rooms;
        this.getAttendees()
            .then(attendees => this.attendees = attendees)
            .catch(err => { Logger.error(err) });
    }

    async getAttendees(): Promise<Map<string, User>> {
        const attendeeMap = new Map<string, User>();
        if (!this.eventId) return;
        if (this.eventId.length == 0) return;
        await axios.get(`https://www.eventbriteapi.com/v3/events/${this.eventId}/attendees`, 
            {headers: {
                'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
                'Content-Type': 'application/json',
            }}
        ).then((res) => {
            Logger.info(`Attendees from new eventid ${this.eventId}.`);
            res.data.attendees.forEach(attendee => { 
                attendeeMap.set(attendee.order_id, {
                    name: attendee.profile.name,
                    email: attendee.profile.email,
                    ticket: attendee.order_id,
                    firstName: attendee.profile.first_name,
                    isAdmin: false
                });
            });
            return attendeeMap;
        }).catch((err) => {
            Logger.error(err.message);
            throw `eventId ${this.eventId} not found`;
        })
        return attendeeMap;
    }

    generateAttendee(ticket, email): User {
        return { ticket, email, name: ticket, firstName: ticket, isAdmin: false }
    }
}