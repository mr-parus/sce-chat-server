import { config } from './config';
import { log } from './utils/logger';
import { Server } from './server/Server';
import { connect as connectToMongoDB } from './utils/mongo';

process.on('unhandledRejection', (err: Error) => {
    log.error('unhandledRejection: %s', err.message);
});

process.on('multipleResolves', (type, promise, value) => {
    log.error('multipleResolves %s %s %s', type, promise, value);
});

const init = async (): Promise<void> => {
    await connectToMongoDB();

    const server = Server.ofConfig(config);
    await server.listen();
};

init().catch((err) => log.error('On start error: %s', err.message));
