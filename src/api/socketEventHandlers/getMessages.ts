import * as SocketEvent from '../common/types/SocketEvent';
import { getStoredMessages } from '../modules/messages/services/getStoredMessages';
import { InvalidJWTTokenError } from '../common/errors/InvalidJWTTokenError';
import { log } from '../../utils/logger';
import { SocketEventHandler } from '../common/types/SocketEventHandler';
import { SocketEventName } from '../common/types/SocketEventName';
import { TokenEncoder } from '../../utils/TokenEncoder';
import { WrongArgumentError } from '../common/errors/WrongArgumentError';

export const getMessages: SocketEventHandler = async (io, socket, eventBody /*context*/) => {
    const [targetUserId, token] = eventBody as SocketEvent.GetMessages;
    try {
        if (!token) {
            socket.emit(SocketEventName.getMessagesResult, ['Not authorised!'] as SocketEvent.GetMessagesResult);
            return;
        }

        const userId = await TokenEncoder.decode(token);
        const messages = await getStoredMessages(userId, targetUserId);

        socket.emit(SocketEventName.getMessagesResult, [0, targetUserId, messages] as SocketEvent.GetMessagesResult);
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.getMessagesResult, [error.reason] as SocketEvent.GetMessagesResult);
            return;
        }

        if (error instanceof InvalidJWTTokenError) {
            socket.emit(SocketEventName.getMessagesResult, ['Not authorised!'] as SocketEvent.GetMessagesResult);
            return;
        }

        log.error(error);
        return;
    }
};
