import PQueue from 'p-queue';

import { SocketEventHandler } from '../../common/types/SocketEventHandler';
import { SocketEventName } from '../../common/types/SocketEventName';
import { JoinEventBody, JoinResultEventBody, NewJoinResponseEventBody } from '../../common/types/SocketEventBody';
import { saveUserIfNotExists } from '../services/saveUserIfNotExists';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';
import { log } from '../../../utils/logger';
import { getOnlineDialogs } from '../../messages/services/getOnlineDialogs';

const joinQueue = new PQueue({ concurrency: 1 });

export const joinChat: SocketEventHandler = async (io, socket, eventBody, context) => {
    return joinQueue.add(async () => {
        const [username] = eventBody as JoinEventBody;
        const { chatRoomId } = context;

        // verify if there is no online users with the same username
        const userData = context.onlineUsers.get(username);
        if (userData) {
            socket.emit(SocketEventName.joinResult, ['A user with such username is already in the chat!']);
            return;
        }

        // store user in DB
        try {
            await saveUserIfNotExists({ username });
        } catch (error) {
            if (error instanceof WrongArgumentError) {
                socket.emit(SocketEventName.joinResult, [error.reason] as JoinResultEventBody);
                return;
            }

            log.error(error);
            return;
        }

        // mark user as online
        context.onlineUsers.set(username, { socket });

        // set on disconnect listeners
        socket.on('disconnect', () => {
            context.onlineUsers.delete(username);
            io.in(chatRoomId).emit(SocketEventName.disconnect, [username]);
            log.silly('User with username "%s" disconnected.', username);
        });

        // notify everyone in the room about new user join
        io.in(chatRoomId).emit(SocketEventName.newJoin, [username] as NewJoinResponseEventBody);

        // add this user to the room
        socket.join(chatRoomId);

        // notify user about successful join
        const dialogs = await getOnlineDialogs(username, context);
        socket.emit(SocketEventName.joinResult, [0, dialogs] as JoinResultEventBody);
        log.silly('User with username "%s" joined the chat.', username);
    });
};
