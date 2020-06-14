import convict from "convict";
import dotEnv from "dotenv";
import path from "path";

if (process.env.NODE_ENV === 'test') {
    const { error } = dotEnv.config({ path: path.resolve(__dirname, './test.env') });
    if (error) throw error;
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
    JWT_SECRET: {
        default: null,
        env: 'JWT_SECRET',
        format: String,
    },
    LOGS_LEVEL: {
        default: 'silly',
        env: 'LOGS_LEVEL',
        format: String,
    },
    SERVER_PORT: {
        default: 3000,
        env: 'PORT',
        format: 'nat',
    },
};

export type ConfigSchema = {
    DB_MONGO_CONNECTION_URI: string;
    DB_MONGO_HOST: string;
    DB_MONGO_PORT: number;
    JWT_SECRET: string;
    LOGS_LEVEL: string;
    SERVER_PORT: number;
};

export const config = convict<ConfigSchema>(configSchema);

// Perform validation
config.validate({ allowed: 'strict' });
