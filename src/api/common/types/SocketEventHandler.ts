import SocketIO from 'socket.io';
import { SocketEventBodies } from './SocketEventBodies';
import { SocketContext } from './SocketContext';

export type SocketEventHandler = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    message: SocketEventBodies,
    context: SocketContext
) => Promise<void>;
