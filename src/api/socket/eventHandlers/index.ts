import { getMessages } from './getMessages';
import { joinChat } from './joinChat';
import { readDialog } from './readDialog';
import { sendMessage } from './sendMessage';
import { SocketEventName } from '../../modules/common/types/SocketEventName';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
    [SocketEventName.sendMessage]: sendMessage,
    [SocketEventName.getMessages]: getMessages,
    [SocketEventName.read]: readDialog,
};
