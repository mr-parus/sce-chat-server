import { SocketEventHandler } from '../../common/types/SocketEventHandler';
import { SocketEventName } from '../../common/types/SocketEventName';
import {
    ReceiveMessageEventBody,
    SendMessageEventBody,
    SendMessageResultEventBody,
} from '../../common/types/SocketEventBody';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';
import { log } from '../../../utils/logger';
import { saveMessage } from '../../messages/services/saveMessage';
import { TokenEncoder } from '../../../utils/TokenEncoder';
import { InvalidJWTTokenError } from '../../common/errors/InvalidJWTTokenError';

export const sendMessage: SocketEventHandler = async (io, socket, eventBody, context) => {
    const [providedMessage, token, confirmationHash] = eventBody as SendMessageEventBody;
    try {
        if (!token) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SendMessageResultEventBody);
            return;
        }

        const userId = await TokenEncoder.decode(token);
        if (userId !== providedMessage.from) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SendMessageResultEventBody);
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
        ] as SendMessageResultEventBody);

        // send the message to the receiver
        const receiverSocket = context.onlineUser2Socket.get(message.to);
        if (receiverSocket?.connected) {
            receiverSocket.emit(SocketEventName.receiveMessage, [message] as ReceiveMessageEventBody);
        }
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.sendMessageResult, [
                error.reason,
                confirmationHash,
            ] as SendMessageResultEventBody);
            return;
        }

        if (error instanceof InvalidJWTTokenError) {
            socket.emit(SocketEventName.sendMessageResult, [
                'Not authorised!',
                confirmationHash,
            ] as SendMessageResultEventBody);
            return;
        }

        log.error(error);
        return;
    }
};
