import SocketIO from 'socket.io';
import { SocketEventBody } from './SocketEventBody';
import { SocketEventsContext } from './SocketEventsContext';

export type SocketEventHandler = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    message: SocketEventBody,
    context: SocketEventsContext
) => void;
