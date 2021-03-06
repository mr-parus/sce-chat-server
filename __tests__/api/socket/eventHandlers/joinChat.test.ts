import mongoose from 'mongoose';
import SocketIOClient from 'socket.io-client';
import waitForExpect from 'wait-for-expect';

import * as SocketEvent from '../../../../src/api/modules/common/types/SocketEvent';
import { config } from '../../../../src/config';
import { connect as connectToMongoDB } from '../../../../src/utils/mongo';
import { ContextCreator } from '../../../../src/api/socket/ContextCreator';
import { getClientSocketConnection } from '../../../../src/utils/getClientSocketConnection';
import { IUser } from '../../../../src/api/modules/common/types/IUser';
import { Message } from '../../../../src/api/modules/messages/models/Message';
import { saveUserIfNotExists } from '../../../../src/api/modules/users/services/saveUserIfNotExists';
import { Server } from '../../../../src/server/Server';
import { socketEventHandlers } from '../../../../src/api/socket/eventHandlers';
import { SocketEventName } from '../../../../src/api/modules/common/types/SocketEventName';
import { socketMiddlewares } from '../../../../src/api/socket/middlewares';
import { TokenEncoder } from '../../../../src/utils/TokenEncoder';
import { User } from '../../../../src/api/modules/users/models/User';

describe('joinChat (socket event handler)', () => {
    let server: Server;
    let mongoConnection: mongoose.Mongoose;

    let targetClient: SocketIOClient.Socket;
    let anotherClient: SocketIOClient.Socket;

    let targetUser: IUser;
    const targetUsername = 'Bob';
    const anotherUsername = 'Alice';

    let token: string;

    beforeAll(async () => {
        mongoConnection = await connectToMongoDB();

        server = Server.ofConfig(config);
        server.initSocket({
            eventHandlers: socketEventHandlers,
            middlewares: socketMiddlewares,
            contextCreator: ContextCreator.create,
        });
        await server.listen();

        targetUser = await saveUserIfNotExists({ username: targetUsername });
        token = await TokenEncoder.encode(targetUser.id);
    });

    afterAll(async () => {
        await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
        await mongoConnection.disconnect();
        await server.close();
    });

    beforeEach(async () => {
        targetClient = await getClientSocketConnection(server.address);
    });

    afterEach(async () => {
        if (targetClient?.connected) await targetClient.disconnect();
        if (anotherClient?.connected) await anotherClient.disconnect();
    });

    it('should join new user to chat', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage, connectedUser] = eventBody;

            expect(errorMessage).toBe(0);
            if (!connectedUser) throw new Error('User is not present!');
            expect(connectedUser.username).toBe(targetUsername);
            expect(typeof connectedUser.id).toBe('string');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should join with a JWT token', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [null, token] as SocketEvent.Join);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage, connectedUser] = eventBody;

            expect(errorMessage).toBe(0);
            if (!connectedUser) throw new Error('User is not present!');
            expect(connectedUser.username).toBe(targetUsername);
            expect(typeof connectedUser.id).toBe('string');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should return JWT token', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [, user, , token] = eventBody as SocketEvent.JoinResult;
            if (!user || !token) throw new Error('user or token is not defined!');

            expect(typeof token).toBe('string');
            return TokenEncoder.decode(token).then((id) => {
                expect(id).toBe(user.id);
                done();
            });
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if username is too long (>20)', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, ['X'.repeat(21)] as SocketEvent.Join);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage] = eventBody;

            expect(errorMessage).toBe('Username is too long');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if username is too short (<2)', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, ['X'] as SocketEvent.Join);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage] = eventBody;

            expect(errorMessage).toBe('Username is too short');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if user with such username is already connected', async () => {
        expect(targetClient.connected).toEqual(true);

        const done = jest.fn();

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);
        anotherClient.on(SocketEventName.joinResult, done);
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        // target user joins the chat with the same username
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);

        // wait for event
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage] = eventBody;
            expect(errorMessage).toContain('A user with such username is already in the chat!');
            done();
        });

        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
        await anotherClient.disconnect();
    });

    it('should notify other users about new user joined', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);

        // another 3 users join the chat
        const anotherClients = await Promise.all([
            getClientSocketConnection(server.address),
            getClientSocketConnection(server.address),
            getClientSocketConnection(server.address),
        ]);
        anotherClients.forEach((client, i) => {
            client.emit(SocketEventName.join, [anotherUsername + i] as SocketEvent.Join);
        });

        // wait for all events
        const newUsers = {
            [anotherUsername + '0']: 0,
            [anotherUsername + '1']: 0,
            [anotherUsername + '2']: 0,
        };
        targetClient.on(SocketEventName.newJoin, (eventBody: SocketEvent.NewJoinResponse) => {
            const [newUser] = eventBody;
            newUsers[newUser.username] = 1;
        });
        await waitForExpect(() => {
            expect(newUsers).toEqual({
                [anotherUsername + '0']: 1,
                [anotherUsername + '1']: 1,
                [anotherUsername + '2']: 1,
            });
        });

        await Promise.all(anotherClients.map((client) => client.disconnect()));
    });

    it('should return all online users in the room', async () => {
        expect(targetClient.connected).toEqual(true);

        // another user joins the chat
        const done = jest.fn();
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername] as SocketEvent.Join);
        anotherClient.on(SocketEventName.joinResult, done);
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);

        // wait for event
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            const [errorMessage, , onlineUsers] = eventBody;
            if (!onlineUsers) throw new Error('onlineUsers should be defined!');
            expect(onlineUsers.length).toBe(1);
            expect(onlineUsers[0].username).toBe(anotherUsername);
            expect(errorMessage).toBe(0);
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        await anotherClient.disconnect();
    });

    it('should notify if a user disconnected', async () => {
        // target user joins the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername] as SocketEvent.Join);
        anotherClient.on(SocketEventName.joinResult, done);
        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // wait for event
        targetClient.on(SocketEventName.disconnect, (eventBody: SocketEvent.Disconnect) => {
            const [disconnectedUser] = eventBody;
            expect(disconnectedUser.username).toBe(anotherUsername);
            done();
        });
        await anotherClient.disconnect();
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });
});
