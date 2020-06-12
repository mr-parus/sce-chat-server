import mongoose from 'mongoose';
import waitPort from 'wait-port';

import { log } from './logger';
import { config } from '../config';

const connectURI = config.get('DB_MONGO_CONNECTION_URI');
const host = config.get('DB_MONGO_HOST');
const port = config.get('DB_MONGO_PORT');

mongoose.set('useCreateIndex', true);
mongoose.Promise = Promise;
mongoose.connection.on('connecting', () => log.debug('Trying to connect to MongoDB: %s', connectURI));
mongoose.connection.on('connected', () => log.debug('The connection established to MongoDB: %s', connectURI));
mongoose.connection.on('disconnected', () => log.debug('Disconnected from MongoDB: %s', connectURI));
mongoose.connection.on('reconnected', () => log.debug('Reconnected to MongoDB: %s', connectURI));

export const connect = async (): Promise<mongoose.Mongoose> => {
    try {
        new Promise((res) => waitPort({ host, port, timeout: 5000 }).then(res));

        const connection = await mongoose.connect(connectURI, {
            autoIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        log.info(`Connected to MongoDB: ${connectURI}`);
        return connection;
    } catch (e) {
        log.error('Unable to connect to MongoDB: %s', connectURI);
        throw e;
    }
};
