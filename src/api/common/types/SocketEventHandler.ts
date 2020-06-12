import SocketIO from 'socket.io';
import { SocketEventBody } from './SocketEventBody';
import { SocketContext } from './SocketContext';

export type SocketEventHandler = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    eventBody: SocketEventBody,
    context: SocketContext
) => Promise<void>;
