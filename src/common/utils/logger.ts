import { createLogger, transports, format } from 'winston';
import { config } from '../../config';

export const log = createLogger({
    format: format.combine(format.colorize({ all: true }), format.splat(), format.ms(), format.simple()),
    level: config.get('logs_level'),
    transports: [new transports.Console()],
});
