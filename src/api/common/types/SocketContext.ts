import SocketIO from 'socket.io';
import { IUser } from './IUser';

export interface SocketContext {
    chatRoomId: string;
    onlineUser2Socket: Map<IUser['id'], SocketIO.Socket>;
    onlineUsers: Map<IUser['id'], IUser>;
    onlineUserNames: Map<IUser['username'], 1>;
}
