import axios from "axios";
import { EVENTS } from "./utils/events";
import Logger from "./utils/logger";
import * as dotenv from 'dotenv';

dotenv.config();

// To place all admin callbacks later.
export const updateShowEvent = ({name, eventId, rooms}, socket, show, attendees) => {
    name = name.trim();
    eventId = eventId.trim();
    const isEventIdDiff = eventId != show.eventId;
    show = {name, eventId, rooms};
    Logger.info(`Successfully updated current show: ${JSON.stringify(show)}`)

    axios.get(`https://www.eventbriteapi.com/v3/events/${eventId}/attendees`, 
        {headers: {
            'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
            'Content-Type': 'application/json',
        }}
    ).then((res) => {
        Logger.info(`Attendees from new eventid ${eventId}.`);
        attendees = res.data.attendees.map(attendee => { return {
            profile: attendee.profile,
            ticket: attendee.order_id, }
        });
        Logger.info(attendees);
        socket.emit(EVENTS.SERVER.ATTENDEE_LIST, attendees);
    }).catch((err) => {
        // inform client that it's invalid
        Logger.error(err);
    })
    socket.emit(EVENTS.SERVER.CURRENT_SHOW, show);
}