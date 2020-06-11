import PQueue from 'p-queue';

import { SocketEventHandler } from '../../common/types/SocketEventHandler';
import { SocketEventName } from '../../common/types/SocketEventName';
import { JoinEventBody, JoinResponseEventBody, NewJoinResponseEventBody } from '../../common/types/SocketEventBodies';
import { saveUserIfNotExists } from '../services/saveUserIfNotExists';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';
import { log } from '../../../utils/logger';
import { getDialogs } from '../services/getDialogs';

const joinQueue = new PQueue({ concurrency: 1 });

export const joinChat: SocketEventHandler = async (io, socket, eventBody: JoinEventBody, context) => {
    return joinQueue.add(async () => {
        const [username] = eventBody;
        const { chatRoomId } = context;

        // verify if there is no online users with the same username
        const userData = context.onlineUsers.get(username);
        if (userData) {
            socket.emit(SocketEventName.joinResult, ['A user with such username is already in the chat!']);
            return;
        }

        // mark user as online
        context.onlineUsers.set(username, { socket });
        socket.on('disconnect', () => {
            log.silly('User with username "%s" disconnected.', username);
            context.onlineUsers.delete(username);
        });

        // store user in DB
        try {
            await saveUserIfNotExists({ username });
        } catch (error) {
            if (error instanceof WrongArgumentError) {
                socket.emit(SocketEventName.joinResult, [error.reason] as JoinResponseEventBody);
                return;
            }

            log.error(error);
            return;
        }

        // notify everyone in the room about new user join
        io.in(chatRoomId).emit(SocketEventName.newJoin, [username] as NewJoinResponseEventBody);

        // add this user to the room
        socket.join(chatRoomId);

        // notify user that about successful join
        const dialogs = await getDialogs(username, context);
        socket.emit(SocketEventName.joinResult, [0, dialogs] as JoinResponseEventBody);
        log.silly('User with username "%s" joined the chat.', username);
    });
};
