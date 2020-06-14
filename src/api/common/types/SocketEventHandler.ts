import SocketIO from 'socket.io';
import { SocketIncomingEventBody } from './SocketEventBody';
import { SocketContext } from './SocketContext';

export type SocketEventHandler = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    eventBody: SocketIncomingEventBody,
    context: SocketContext
) => Promise<void>;
