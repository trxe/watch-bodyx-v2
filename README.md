# BODYX

Current functionality:
- Enter in registered email and ticket to login
- Admin can edit the Event Title, Eventbrite Event ID, and rooms which will be saved to the local database
- Admin can fetch list of attendees from Eventbrite by inputting a valid event id
- Viewer can enter unlocked rooms (room with index 0 is the main room and is always unlocked)
- Viewer can watch videos hosted in the unlocked rooms upon entering
- When admin locks a room, viewer is automatically moved to the main room
- Admin can fetch list of users currently logged in (to clean up)

## Client TODO

- [ ] Admit only ticketed individuals
- [ ] Admin edit room details
- [ ] Admin delete room
- [ ] Waiting room
- [ ] Start show (opening house)
- [ ] EventID color indicator for showing if event is valid
- [ ] User list (User ticket, room, color for whether admin or not, kick or force move)
- [ ] Create/Save/Load events
- [ ] Basic chat frontend
- [ ] Basic poll frontend
- [ ] Allow admin to create start and end time
- [ ] Connect to the server only on login

## Server TODO

- [ ] Waiting room
- [ ] Start show (opening house)
- [ ] Hook to update eventId/show title only
- [ ] Hook to return just the values of the Map of the `connectedClients`
- [ ] Force kick/Ban a ticket
- [ ] Mark each present attendee in the event attendee list 
- [ ] Trigger house open when "start" is pressed.
- [ ] Allow admin to save rooms, start and end times to the database
- [ ] Basic chat backend
- [ ] Basic poll backend