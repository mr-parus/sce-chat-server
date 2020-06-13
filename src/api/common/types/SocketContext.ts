import SocketIO from 'socket.io';
import { IUser } from './IUser';

export interface SocketContext {
    chatRoomId: string;
    onlineUsers: Map<string, { socket: SocketIO.Socket; user: IUser }>;
}
