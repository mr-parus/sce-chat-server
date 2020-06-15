import * as SocketEvent from '../../modules/common/types/SocketEvent';
import { log } from '../../../utils/logger';
import { SocketContext } from '../../modules/common/types/SocketContext';
import { SocketEventHandler } from '../../modules/common/types/SocketEventHandler';
import { SocketEventName } from '../../modules/common/types/SocketEventName';
import { TokenEncoder } from '../../../utils/TokenEncoder';

export const readDialog: SocketEventHandler<SocketContext> = async (io, socket, eventBody, context) => {
    const [targetUserId, token] = eventBody as SocketEvent.GetMessages;
    try {
        if (!token) return;

        const userId = await TokenEncoder.decode(token);

        const interlocutorSocket = context.onlineUser2Socket.get(targetUserId);
        if (interlocutorSocket) {
            interlocutorSocket.emit(SocketEventName.interlocutorReadDialog, [
                userId,
            ] as SocketEvent.InterlocutorReadDialog);
        }
    } catch (error) {
        log.error(error);
        return;
    }
};
