import SocketIO, { Packet } from 'socket.io';

export type SocketMiddleware<ContextType> = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    context: ContextType
) => (packet: Packet, fn: (err?: unknown) => void) => void;
