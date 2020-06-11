import cors from '@koa/cors';
import http from 'http';
import Koa from 'koa';
import sioWildcard from 'socketio-wildcard';
import SocketIO from 'socket.io';
import { AddressInfo } from 'net';
import { promisify } from 'util';

import { log } from '../utils/logger';
import { SocketEventType } from '../api_socket/types/SocketEventType';
import { SocketMessageBody } from '../api_socket/types/SocketMessageBody';

export class Server {
    private readonly _app: Koa;
    private readonly _io: SocketIO.Server;
    private readonly _server: http.Server;
    private _eventHandlers: { [key in SocketEventType]?: (data: SocketMessageBody) => void } = {};

    constructor() {
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

    set eventHandlers(eventHandlers: { [key in SocketEventType]?: (data: SocketMessageBody) => void }) {
        this._eventHandlers = Object.freeze(eventHandlers);
    }

    //

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
        if (!Object.keys(this._eventHandlers).length) log.warn('No socket event handlers provided!');

        this._io.on('connect', (socket) => {
            log.silly('New socket connection! (id=%s)', socket.id);

            socket.on('*', (packet) => {
                const [eventName, eventPayload] = packet.data;
                const handler = this._eventHandlers[eventName as SocketEventType];

                if (!handler) {
                    // Let's consider all events which do not meet our schema as 'suspicious'.
                    // All data should be logged for farther analysis.
                    log.error('Unexpected event: "%s". Requester data: %o', eventName, socket.handshake);

                    // It's better to disconnect such connections
                    socket.disconnect();
                    return;
                }

                // todo: add eventPayload validations

                try {
                    handler(eventPayload);
                } catch (err) {
                    log.error(`Error while handling socket event "%s": %s`, eventName, err);
                }
            });
        });
    }

    //

    public async listen(serverPort: number): Promise<void> {
        await promisify(this._server.listen.bind(this._server))(serverPort);
        log.debug(`Server run at port: '%d'`, serverPort);
    }

    public async close(): Promise<void> {
        await promisify(this._io.close.bind(this._io))();
        await promisify(this._server.close.bind(this._server))();
        log.debug('Server closed!');
    }
}
