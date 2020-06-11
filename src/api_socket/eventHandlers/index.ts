import { SocketEventName } from '../types/SocketEventName';
import { joinChat } from './joinChat';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
};
