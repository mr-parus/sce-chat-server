import { SocketEventName } from '../../common/types/SocketEventName';
import { joinChat } from './joinChat';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
};
