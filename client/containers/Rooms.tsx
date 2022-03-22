import { useRef } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";

export interface IRoom {
    name: string;
    url:  string;
}

const RoomsContainer = () => {

    /*
    const {socket, roomId, rooms} = useSockets()
    const newRoomRef = useRef(null);

    const handleCreateRoom = () => {
        const roomName = newRoomRef.current.value || "";
        if (!String(roomName).trim()) return;
        socket.emit(EVENTS.CLIENT.CREATE_ROOM, {roomName});
        newRoomRef.current.value = "";
    }

    const handleJoinRoom = (key: string) => {
        if (key === roomId) return;
        socket.emit(EVENTS.CLIENT.JOIN_ROOM, {roomName: key});
    }

    return <nav>
        <div>
            <input ref={newRoomRef} placeholder="Room Name" />
            <button onClick={handleCreateRoom}>Create</button>
        </div>
        <h1>Rooms</h1>
        {Object.keys(rooms).map(key => <div key={key}>
            <button disabled={key === roomId} 
                onClick={() => handleJoinRoom(key)}>Join {key}</button>
        </div>)}

    </nav>;
    */
   return <div>Rooms</div>;
}

export default RoomsContainer;