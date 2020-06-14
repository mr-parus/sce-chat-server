import * as SocketEvent from '../common/types/SocketEvent';
import { InvalidJWTTokenError } from '../common/errors/InvalidJWTTokenError';
import { log } from '../../utils/logger';
import { saveMessage } from '../modules/messages/services/saveMessage';
import { SocketEventHandler } from '../common/types/SocketEventHandler';
import { SocketEventName } from '../common/types/SocketEventName';
import { TokenEncoder } from '../../utils/TokenEncoder';
import { WrongArgumentError } from '../common/errors/WrongArgumentError';

export const sendMessage: SocketEventHandler = async (io, socket, eventBody, context) => {
    const [providedMessage, token, confirmationHash] = eventBody as SocketEvent.SendMessage;
    try {
        if (!token) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SocketEvent.SendMessageResult);
            return;
        }

        const userId = await TokenEncoder.decode(token);
        if (userId !== providedMessage.from) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SocketEvent.SendMessageResult);
            return;
        }

        // store message
        const message = await saveMessage(providedMessage);
        // respond about receiving the message
        socket.emit(SocketEventName.sendMessageResult, [
            0,
            confirmationHash,
            message.id,
            message.sentAt,
        ] as SocketEvent.SendMessageResult);

        // send the message to the receiver
        const receiverSocket = context.onlineUser2Socket.get(message.to);
        if (receiverSocket?.connected) {
            receiverSocket.emit(SocketEventName.receiveMessage, [message] as SocketEvent.ReceiveMessage);
        }
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.sendMessageResult, [
                error.reason,
                confirmationHash,
            ] as SocketEvent.SendMessageResult);
            return;
        }

        if (error instanceof InvalidJWTTokenError) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SocketEvent.SendMessageResult);
            return;
        }

        log.error(error);
        return;
    }
};
