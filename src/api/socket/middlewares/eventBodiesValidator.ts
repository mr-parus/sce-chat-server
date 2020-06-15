import { SocketMiddleware } from '../../modules/common/types/SocketMiddleware';
import { SocketContext } from '../../modules/common/types/SocketContext';
import { log } from '../../../utils/logger';
import { socketEventBodiesValidators } from '../eventHandlers';
import { SocketEventName } from '../../modules/common/types/SocketEventName';

export const eventBodiesValidator: SocketMiddleware<SocketContext> = (io, socket /*context*/) => {
    return (packet, next): void => {
        const eventName = packet[0] as SocketEventName;
        const eventBody = packet[1];

        const socketEvents = (socket as any)?._events || {};

        if (!(eventName in socketEvents)) {
            // Let's consider all events which do not meet our schema as 'suspicious'.
            // All data should be logged for farther analysis.
            log.error('Unexpected event: "%s". Body: %o. Requester data: %o', eventName, eventBody, socket.handshake);

            // It's better to disconnect such connections
            socket.disconnect();
            return;
        }

        const validator = socketEventBodiesValidators[eventName];
        if (validator) {
            const { error } = validator.validate(packet[1]);
            if (error) {
                log.error('Unexpected event body: %o. Requester data: %o', eventBody, socket.handshake);
                socket.disconnect();
            }
        }
        next();
    };
};
