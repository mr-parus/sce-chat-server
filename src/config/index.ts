import convict from 'convict';

const configSchema = {
    LOGS_LEVEL: {
        default: 'silly',
        env: 'LOGS_LEVEL',
        format: String,
    },
};

export type ConfigSchema = {
    LOGS_LEVEL: string;
};

export const config = convict<ConfigSchema>(configSchema);

// Perform validation
config.validate({ allowed: 'strict' });
