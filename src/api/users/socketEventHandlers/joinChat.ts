import { SocketEventHandler } from '../../common/types/SocketEventHandler';
import { SocketEventName } from '../../common/types/SocketEventName';
import {
    DisconnectEventBody,
    JoinEventBody,
    JoinResultEventBody,
    NewJoinResponseEventBody,
} from '../../common/types/SocketEventBody';
import { saveUserIfNotExists } from '../services/saveUserIfNotExists';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';
import { log } from '../../../utils/logger';
import { TokenEncoder } from '../../../utils/TokenEncoder';
import { findUSerById } from '../services/findUserById';
import { IUser } from '../../common/types/IUser';

export const joinChat: SocketEventHandler = async (io, socket, eventBody, context) => {
    try {
        const [providedUsername, providedToken] = eventBody as JoinEventBody;
        const { chatRoomId } = context;

        // retrieve user from token if provided
        let restoredUser: IUser | null = null;
        if (!providedUsername && providedToken) {
            const userId = await TokenEncoder.decode(providedToken);
            restoredUser = (await findUSerById(userId)) as IUser;

            if (!restoredUser) {
                socket.emit(SocketEventName.joinResult, ['Bad token!']);
                return;
            }
        }

        // verify if there is no online users with the same username
        const username = restoredUser?.username || (providedUsername as string);
        if (context.onlineUserNames.get(username)) {
            socket.emit(SocketEventName.joinResult, ['A user with such username is already in the chat!']);
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
            io.in(chatRoomId).emit(SocketEventName.disconnect, [user] as DisconnectEventBody);
            log.silly(`User with username "%s" disconnected.`, username);
        });

        // notify everyone in the room about new user join
        io.in(chatRoomId).emit(SocketEventName.newJoin, [user] as NewJoinResponseEventBody);

        // add this user to the room
        socket.join(chatRoomId);

        // generate token
        const token = await TokenEncoder.encode(user.id);

        // notify user about successful join
        socket.emit(SocketEventName.joinResult, [0, user, onlineUsers, token] as JoinResultEventBody);
        log.silly(`User with username "%s" joined the chat.`, username);
    } catch (error) {
        if (error instanceof WrongArgumentError) {
            socket.emit(SocketEventName.joinResult, [error.reason] as JoinResultEventBody);
            return;
        }

        log.error(error);
        if (socket?.connected) {
            socket.emit(SocketEventName.sendMessageResult, ['Unexpected error.']);
        }
    }
};
