import { IDialog } from '../../common/types/IDialog';
import { SocketContext } from '../../common/types/SocketContext';

export const getOnlineDialogs = async (requesterUsername: string, socketContext: SocketContext): Promise<IDialog[]> => {
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
