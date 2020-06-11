import { Dialog } from '../../common/types/Dialog';
import { SocketContext } from '../../common/types/SocketContext';

export const getDialogs = async (requesterUsername: string, socketContext: SocketContext): Promise<Dialog[]> => {
    const onlineUserNames = [...socketContext.onlineUsers.keys()];

    return onlineUserNames
        .filter((userName) => userName !== requesterUsername)
        .map((username) => {
            return {
                unread: 0,
                from: username,
            };
        });
};
