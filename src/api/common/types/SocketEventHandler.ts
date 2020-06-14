import SocketIO from 'socket.io';
import * as SocketEvent from './SocketEvent';
import { SocketContext } from './SocketContext';

export type SocketEventHandler = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    eventBody: SocketEvent.IncomingEvent,
    context: SocketContext
) => Promise<void>;
