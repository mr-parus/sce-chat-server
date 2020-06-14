import cors from '@koa/cors';
import http from 'http';
import Koa from 'koa';
import sioWildcard from 'socketio-wildcard';
import SocketIO from 'socket.io';
import { AddressInfo } from 'net';
import { promisify } from 'util';

import { Config } from 'convict';
import { ConfigSchema } from '../config';
import { log } from '../utils/logger';
import { SocketContext } from '../api/modules/common/types/SocketContext';
import { SocketEventHandler } from '../api/modules/common/types/SocketEventHandler';
import { SocketEventName } from '../api/modules/common/types/SocketEventName';

export class Server {
    private _socketEventHandlers: { [key in SocketEventName]?: SocketEventHandler } = {};
    private readonly _app: Koa;
    private readonly _io: SocketIO.Server;
    private readonly _server: http.Server;
    private readonly _socketContext: SocketContext = {
        chatRoomId: 'cool_chat', // all new connections should be at the same room
        onlineUser2Socket: new Map(),
        onlineUserNames: new Map(),
        onlineUsers: new Map(),
    };

    constructor(public readonly serverPort: number) {
        this._app = Server.createApp();

        this._server = Server.createHTTPServer();
        this._server.on('request', this._app.callback());

        this._io = Server.createSocket();
        this._io.attach(this._server);
        this.initSocket();
    }

    get address(): AddressInfo {
        return this._server.address() as AddressInfo;
    }

    set socketEventHandlers(eventHandlers: { [key in SocketEventName]?: SocketEventHandler }) {
        this._socketEventHandlers = Object.freeze(eventHandlers);
    }

    //

    static ofConfig(config: Config<ConfigSchema>): Server {
        const serverPort = config.get('SERVER_PORT');
        return new Server(serverPort);
    }

    static createApp(): Koa {
        const app = new Koa();

        // todo: add security restrictions
        app.use(cors());

        app.on('error', (err) => log.error('Error occurred: %s', err.message));

        return app;
    }

    static createHTTPServer(): http.Server {
        const server = http.createServer();
        server.on('error', (error) => log.error('Server failed with error: %s', error));
        return server;
    }

    static createSocket(): SocketIO.Server {
        // todo: add security restrictions
        const io = SocketIO({ origins: '*:*' });
        io.use(sioWildcard());
        return io;
    }

    //

    public initSocket(): void {
        if (!Object.keys(this._socketEventHandlers).length) log.warn('No socket event handlers provided!');

        this._io.on('connect', (socket) => {
            log.silly('New socket connection! (id=%s)', socket.id);

            socket.on('*', (packet) => {
                log.silly('Socket event: %s', JSON.stringify(packet));
                const [eventName, eventPayload] = packet.data;
                const handler: SocketEventHandler | undefined = this._socketEventHandlers[eventName as SocketEventName];

                if (!handler) {
                    // Let's consider all events which do not meet our schema as 'suspicious'.
                    // All data should be logged for farther analysis.
                    log.error('Unexpected event: "%s". Requester data: %o', eventName, socket.handshake);

                    // It's better to disconnect such connections
                    socket.disconnect();
                    return;
                }

                // todo: add eventPayload validations
                handler(this._io, socket, eventPayload, this._socketContext).catch((err) => {
                    log.error(`Error while handling socket event "%s": %s`, eventName, err);
                });
            });
        });
    }

    //

    public async listen(): Promise<void> {
        await promisify(this._server.listen.bind(this._server))(this.serverPort);
        log.debug(`Server run at port: '%d'`, this.serverPort);
    }

    public async close(): Promise<void> {
        log.debug('Server closed!');
        await promisify(this._io.close.bind(this._io))();
        await promisify(this._server.close.bind(this._server))();
    }
}
