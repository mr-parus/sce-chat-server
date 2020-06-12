import { SocketEventHandler } from '../../common/types/SocketEventHandler';
import { SocketEventName } from '../../common/types/SocketEventName';
import { SendMessageEventBody } from '../../common/types/SocketEventBody';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';
import { log } from '../../../utils/logger';
import { saveMessage } from '../../messages/services/saveMessage';

export const sendMessage: SocketEventHandler = async (io, socket, eventBody, context) => {
    const [message] = eventBody as SendMessageEventBody;

    // verify if this user is entered the chat
    const userData = context.onlineUsers.get(message.from);
    if (!userData) {
        socket.emit(SocketEventName.sendMessageResult, ['Firstly you should join the chat!']);
        return;
    }

    // store message
    try {
        await saveMessage(message);
        // respond about receiving the message
        socket.emit(SocketEventName.sendMessageResult, [0]);
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.sendMessageResult, [error.reason]);
            return;
        }

        log.error(error);
        return;
    }

    // send the message to the receiver
    const receiver = context.onlineUsers.get(message.to);
    if (receiver && receiver.socket.connected) {
        receiver.socket.emit(SocketEventName.receiveMessage, [message]);
    }
};
