import { STATUS } from "./utils/ack";
import { EVENTS } from "./utils/events";

export const socketRoomIndex = (id: string) :string => `room-${id}`

export const joinRoom = ({index}, socket, show, user, callback) => {
    if (user == null) {
        socket.emit(EVENTS.SERVER.GENERIC_ERROR, STATUS.SESSION_EXP);
        return;
    }
    if (user.roomIndex != null && user.roomIndex != index) {
        socket.leave(socketRoomIndex(show.rooms[user.roomIndex]._id.toString()));
    }
    user.roomIndex = index;
    callback(`${user.ticket} joined room ${show.rooms[index].name}`);
    // console.log(show.rooms[index]._id.toString());
    socket.join(socketRoomIndex(show.rooms[index]._id));
};