import cors from '@koa/cors';
import http from 'http';
import Koa from 'koa';
import SocketIO from 'socket.io';
import { AddressInfo } from 'net';
import { promisify } from 'util';

import { Config } from 'convict';
import { ConfigSchema } from '../config';
import { log } from '../utils/logger';
import { SocketEventHandler } from '../api/modules/common/types/SocketEventHandler';
import { SocketEventName } from '../api/modules/common/types/SocketEventName';
import { SocketMiddleware } from '../api/modules/common/types/SocketMiddleware';

export class Server {
    private readonly _app: Koa;
    private readonly _io: SocketIO.Server;
    private readonly _server: http.Server;

    constructor(public readonly serverPort: number) {
        this._app = Server.createApp();

        this._server = Server.createHTTPServer();
        this._server.on('request', this._app.callback());

        this._io = Server.createSocket();
        this._io.attach(this._server);
    }

    get address(): AddressInfo {
        return this._server.address() as AddressInfo;
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
        return SocketIO({ origins: '*:*' });
    }

    //

    public initSocket<ContextType>({
        contextCreator,
        eventHandlers,
        middlewares = [],
    }: {
        contextCreator: () => ContextType;
        eventHandlers?: { [key in SocketEventName]?: SocketEventHandler<ContextType> };
        middlewares?: SocketMiddleware<ContextType>[];
    }): void {
        const socketEventHandlers = Object.freeze(eventHandlers || {});
        if (!Object.keys(socketEventHandlers).length) log.warn('No socket event handlers provided!');

        if (!middlewares.length) log.warn('No socket middlewares provided!');

        const context: ContextType = contextCreator();

        this._io.on('connection', (socket) => {
            log.silly('New socket connection! (id=%s)', socket.id);

            // set up socket middlewares
            middlewares.forEach((middleware) => {
                socket.use(middleware(this._io, socket, context));
            });

            // set up socket event handlers
            Object.entries(socketEventHandlers).forEach(([eventName, eventHandler]) => {
                if (!eventHandler) return;

                socket.on(eventName, (eventBody) => {
                    eventHandler(this._io, socket, eventBody, context).catch((err: Error) => {
                        log.error(`Error while handling socket event "%s": %s`, eventName, err);
                    });
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
