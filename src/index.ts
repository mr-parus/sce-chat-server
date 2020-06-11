import { config } from './config';
import { log } from './utils/logger';
import { Server } from './server/Server';

process.on('unhandledRejection', (err: Error) => {
    log.error('unhandledRejection: %s', err.message);
});

process.on('multipleResolves', (type, promise, value) => {
    log.error('multipleResolves %s %s %s', type, promise, value);
});

const init = async (): Promise<void> => {
    const serverPort = config.get('SERVER_PORT');

    const server = new Server();
    await server.listen(serverPort);
};

init().catch((err) => log.error('On start error: %s', err.message));
