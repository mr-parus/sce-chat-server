import { createLogger, format, transports } from 'winston';
import { config } from '../config';

export const log = createLogger({
    format: format.combine(format.colorize({ all: true }), format.splat(), format.simple()),
    level: config.get('LOGS_LEVEL'),
    transports: [new transports.Console()],
});
