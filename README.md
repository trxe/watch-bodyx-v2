# BODYX

Current functionality:
- Enter in registered email and ticket to login
- Admin can edit the Event Title, Eventbrite Event ID, and rooms which will be saved to the local database
- Admin can fetch list of attendees from Eventbrite by inputting a valid event id
- Viewer can enter unlocked rooms (room with index 0 is the main room and is always unlocked)
- Viewer can watch videos hosted in the unlocked rooms upon entering
- When admin locks a room, viewer is automatically moved to the main room
- Admin can fetch list of users currently logged in, with information of which room they are in
- Admin CRUD rooms
- Admin open and close house (move viewers to/from WAITING_ROOM/MAIN_ROOM)