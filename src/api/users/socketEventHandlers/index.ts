import { SocketEventName } from '../../common/types/SocketEventName';
import { joinChat } from './joinChat';
import { sendMessage } from './sendMessage';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
    [SocketEventName.sendMessage]: sendMessage,
};
