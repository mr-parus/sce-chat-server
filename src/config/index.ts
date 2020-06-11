import convict from 'convict';
import dotEnv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'test') {
    const result = dotEnv.config({ path: path.resolve(__dirname, './test.env') });
    if (result.error) throw result.error;
}

const configSchema = {
    DB_MONGO_CONNECTION_URI: {
        default: null,
        env: 'DB_MONGO_CONNECTION_URI',
        format: String,
    },
    DB_MONGO_HOST: {
        default: null,
        env: 'DB_MONGO_HOST',
        format: String,
    },
    DB_MONGO_PORT: {
        default: null,
        env: 'DB_MONGO_PORT',
        format: 'nat',
    },
    LOGS_LEVEL: {
        default: 'silly',
        env: 'LOGS_LEVEL',
        format: String,
    },
    SERVER_PORT: {
        default: 3000,
        env: 'SERVER_PORT',
        format: 'nat',
    },
    SESSION_SECRET: {
        default: null,
        env: 'SESSION_SECRET',
        format: String,
    },
};

export type ConfigSchema = {
    DB_MONGO_CONNECTION_URI: string;
    DB_MONGO_HOST: string;
    DB_MONGO_PORT: number;
    LOGS_LEVEL: string;
    SERVER_PORT: number;
    SESSION_SECRET: string;
};

export const config = convict<ConfigSchema>(configSchema);

// Perform validation
config.validate({ allowed: 'strict' });
