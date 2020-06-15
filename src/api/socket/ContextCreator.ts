import { SocketContext } from '../modules/common/types/SocketContext';

export class ContextCreator {
    static create(): SocketContext {
        return Object.preventExtensions({
            chatRoomId: 'cool_chat', // all new connections should be at the same room
            onlineUser2Socket: new Map(),
            onlineUserNames: new Map(),
            onlineUsers: new Map(),
        });
    }
}
