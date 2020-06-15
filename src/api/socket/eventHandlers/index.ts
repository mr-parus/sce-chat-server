import { getMessages } from './getMessages';
import { joinChat } from './joinChat';
import { readDialog } from './readDialog';
import { sendMessage } from './sendMessage';
import { SocketEventName } from '../../modules/common/types/SocketEventName';
import * as SocketEventValidator from '../../modules/common/validators/SocketEvent';
import { Schema } from '@hapi/joi';

export const socketEventHandlers = {
    [SocketEventName.join]: joinChat,
    [SocketEventName.sendMessage]: sendMessage,
    [SocketEventName.getMessages]: getMessages,
    [SocketEventName.read]: readDialog,
};

export const socketEventBodiesValidators: { [key in SocketEventName]?: Schema } = {
    [SocketEventName.join]: SocketEventValidator.JoinMessage,
    [SocketEventName.sendMessage]: SocketEventValidator.SendMessage,
    [SocketEventName.getMessages]: SocketEventValidator.GetMessages,
    [SocketEventName.read]: SocketEventValidator.ReadDialog,
};
