import * as SocketEvent from '../../modules/common/types/SocketEvent';
import { findUSerById } from '../../modules/users/services/findUserById';
import { IUser } from '../../modules/common/types/IUser';
import { log } from '../../../utils/logger';
import { saveUserIfNotExists } from '../../modules/users/services/saveUserIfNotExists';
import { SocketContext } from '../../modules/common/types/SocketContext';
import { SocketEventHandler } from '../../modules/common/types/SocketEventHandler';
import { SocketEventName } from '../../modules/common/types/SocketEventName';
import { TokenEncoder } from '../../../utils/TokenEncoder';
import { WrongArgumentError } from '../../modules/common/errors/WrongArgumentError';

export const joinChat: SocketEventHandler<SocketContext> = async (io, socket, eventBody, context) => {
    try {
        const [providedUsername, providedToken] = eventBody as SocketEvent.Join;
        const { chatRoomId } = context;

        // retrieve user from token if provided
        let restoredUser: IUser | null = null;
        if (!providedUsername && providedToken) {
            const userId = await TokenEncoder.decode(providedToken);
            restoredUser = (await findUSerById(userId)) as IUser;

            if (!restoredUser) {
                socket.emit(SocketEventName.joinResult, ['Bad token!'] as SocketEvent.JoinResult);
                return;
            }
        }

        // verify if there is no online users with the same username
        let username = restoredUser?.username || (providedUsername as string);
        username = username.trim();
        if (context.onlineUserNames.get(username)) {
            socket.emit(SocketEventName.joinResult, [
                'A user with such username is already in the chat!',
            ] as SocketEvent.JoinResult);
            return;
        }

        // store user data and mark his as 'online'
        const user = restoredUser || (await saveUserIfNotExists({ username }));
        const onlineUsers = [...context.onlineUsers.values()];
        context.onlineUser2Socket.set(user.id, socket);
        context.onlineUserNames.set(user.username, 1);
        context.onlineUsers.set(user.id, user);

        // set on disconnect listeners
        socket.on('disconnect', () => {
            context.onlineUser2Socket.delete(user.id);
            context.onlineUserNames.delete(user.username);
            context.onlineUsers.delete(user.id);
            io.in(chatRoomId).emit(SocketEventName.disconnect, [user] as SocketEvent.Disconnect);
            log.silly(`User with username "%s" disconnected.`, username);
        });

        // notify everyone in the room about new user join
        io.in(chatRoomId).emit(SocketEventName.newJoin, [user] as SocketEvent.NewJoinResponse);

        // add this user to the room
        socket.join(chatRoomId);

        // generate token
        const token = await TokenEncoder.encode(user.id);

        // notify user about successful join
        socket.emit(SocketEventName.joinResult, [0, user, onlineUsers, token] as SocketEvent.JoinResult);
        log.silly(`User with username "%s" joined the chat.`, username);
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.joinResult, [error.reason] as SocketEvent.JoinResult);
            return;
        }

        log.error(error);
        if (socket?.connected) {
            socket.emit(SocketEventName.sendMessageResult, ['Unexpected error.'] as SocketEvent.JoinResult);
        }
    }
};
