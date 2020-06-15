import SocketIO from 'socket.io';

import * as SocketEvent from './SocketEvent';

export type SocketEventHandler<ContextType> = (
    io: SocketIO.Server,
    socket: SocketIO.Socket,
    eventBody: SocketEvent.Join | SocketEvent.SendMessage | SocketEvent.ReadDialog | SocketEvent.GetMessages,
    context: ContextType
) => Promise<void>;
