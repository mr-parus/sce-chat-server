import SocketIO from 'socket.io';

export interface SocketContext {
    chatRoomId: string;
    onlineUsers: Map<string, { socket: SocketIO.Socket }>;
}
