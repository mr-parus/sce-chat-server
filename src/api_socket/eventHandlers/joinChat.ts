import { SocketEventHandler } from '../types/SocketEventHandler';
import { SocketEventName } from '../types/SocketEventName';
import { JoinEventBody, JoinResponseEventBody, NewJoinEventBody } from '../types/SocketEventBody';
import { v4 as uuidV4 } from 'uuid';

// all new connections should be at the same room.

export const joinChat: SocketEventHandler = (io, socket, eventBody: JoinEventBody, context) => {
    const [username] = eventBody;
    const userId = uuidV4();

    const { chatRoomId } = context;

    // notify everyone in the room about new user join
    io.in(chatRoomId).emit(SocketEventName.newJoin, [username, userId] as NewJoinEventBody);

    // add this user to the room
    socket.join(chatRoomId);

    socket.emit(SocketEventName.joinResponse, [0] as JoinResponseEventBody);
};
