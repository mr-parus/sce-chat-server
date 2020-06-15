import { config } from './config';
import { connect as connectToMongoDB } from './utils/mongo';
import { ContextCreator } from './api/socket/ContextCreator';
import { log } from './utils/logger';
import { Server } from './server/Server';
import { socketEventHandlers } from './api/socket/eventHandlers';
import { socketMiddlewares } from './api/socket/middlewares';

process.on('unhandledRejection', (err: Error) => {
    log.error('unhandledRejection: %s', err.message);
});

process.on('multipleResolves', (type, promise, value) => {
    log.error('multipleResolves %s %s %s', type, promise, value);
});

const init = async (): Promise<void> => {
    await connectToMongoDB();

    const server = Server.ofConfig(config);
    server.initSocket({
        eventHandlers: socketEventHandlers,
        middlewares: socketMiddlewares,
        contextCreator: ContextCreator.create,
    });
    await server.listen();
};

init().catch((err) => log.error('On start error: %s', err.message));
