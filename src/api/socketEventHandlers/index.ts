import { getMessages } from './getMessages';
import { joinChat } from './joinChat';
import { sendMessage } from './sendMessage';
import { SocketEventName } from '../common/types/SocketEventName';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
    [SocketEventName.sendMessage]: sendMessage,
    [SocketEventName.getMessages]: getMessages,
};
