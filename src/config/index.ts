import convict from 'convict';

const configSchema = {
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
};

export type ConfigSchema = {
    LOGS_LEVEL: string;
    SERVER_PORT: number;
};

export const config = convict<ConfigSchema>(configSchema);

// Perform validation
config.validate({ allowed: 'strict' });
