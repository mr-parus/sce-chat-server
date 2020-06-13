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

export const sendMessage: SocketEventHandler = async (io, socket, eventBody, context) => {
    try {
        const [message, token] = eventBody as SendMessageEventBody;

        if (!token) {
            socket.emit(SocketEventName.sendMessageResult, ['Not authorised!'] as SendMessageResultEventBody);
            return;
        }

        const userId = await TokenEncoder.decode(token);
        if (userId !== message.from) {
            socket.emit(SocketEventName.sendMessageResult, ['Not authorised!'] as SendMessageResultEventBody);
            return;
        }

        // store message
        await saveMessage(message);
        // respond about receiving the message
        socket.emit(SocketEventName.sendMessageResult, [0] as SendMessageResultEventBody);

        // send the message to the receiver
        const receiverSocket = context.onlineUser2Socket.get(message.to);
        if (receiverSocket && receiverSocket.connected) {
            receiverSocket.emit(SocketEventName.receiveMessage, [message] as ReceiveMessageEventBody);
        }
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.sendMessageResult, [error.reason] as SendMessageResultEventBody);
            return;
        }

        log.error(error);
        return;
    }
};
