import waitForExpect from 'wait-for-expect';

import { Server } from '../../src/server/Server';
import SocketIOClient from 'socket.io-client';
import { config } from '../../src/config';
import { SocketEventName } from '../../src/api/common/types/SocketEventName';
import { socketEventHandlers } from '../../src/api/users/socketEventHandlers';
import {
    JoinEventBody,
    JoinResponseEventBody,
    NewJoinResponseEventBody,
} from '../../src/api/common/types/SocketEventBodies';
import { getClientSocketConnection } from '../../src/utils/getClientSocketConnection';
import { connect as connectToMongoDB } from '../../src/utils/mongo';
import mongoose from 'mongoose';
import { User } from '../../src/api/users/models/User';

describe('API (socket)', () => {
    let server: Server;
    let mongoConnection: mongoose.Mongoose;
    let clientSocket: SocketIOClient.Socket;
    let anotherClient: SocketIOClient.Socket;
    const targetUsername = 'Bob';
    const anotherUsername = 'Alice';

    beforeAll(async () => {
        mongoConnection = await connectToMongoDB();

        server = Server.ofConfig(config);
        server.socketEventHandlers = socketEventHandlers;
        await server.listen();
    });

    afterAll(async () => {
        User.deleteMany({});
        await mongoConnection.disconnect();
        await server.close();
    });

    beforeEach(async () => {
        clientSocket = await getClientSocketConnection(server.address);
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) clientSocket.disconnect();
        if (anotherClient && anotherClient.connected) anotherClient.disconnect();
    });

    describe('joinChat', () => {
        it('should join new user to chat', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // target user join the chat
            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

            // wait for event
            clientSocket.on(SocketEventName.joinResult, (eventBody: JoinResponseEventBody) => {
                const [errorMessage] = eventBody;

                expect(errorMessage).toBeFalsy();
                done();
            });
            await waitForExpect(() => expect(done).toBeCalledTimes(1));
        });

        it('should deny if username is too long (>20)', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // target user join the chat
            clientSocket.emit(SocketEventName.join, ['X'.repeat(21)] as JoinEventBody);

            // wait for event
            clientSocket.on(SocketEventName.joinResult, (eventBody: JoinResponseEventBody) => {
                const [errorMessage] = eventBody;

                expect(errorMessage).toBe('Username is too long');
                done();
            });

            await waitForExpect(() => expect(done).toBeCalledTimes(1));
        });

        it('should deny if username is too short (<2)', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // target user join the chat
            clientSocket.emit(SocketEventName.join, ['X'] as JoinEventBody);

            // wait for event
            clientSocket.on(SocketEventName.joinResult, (eventBody: JoinResponseEventBody) => {
                const [errorMessage] = eventBody;

                expect(errorMessage).toBe('Username is too short');
                done();
            });
            await waitForExpect(() => expect(done).toBeCalledTimes(1));
        });

        it('should deny if user with such username is already connected', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // another user join the chat
            const anotherClient = await getClientSocketConnection(server.address);
            anotherClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

            // target user join the chat with the same username
            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);
            clientSocket.on(SocketEventName.joinResult, (eventBody: JoinResponseEventBody) => {
                const [errorMessage] = eventBody;
                expect(errorMessage).toContain('A user with such username is already in the chat!');
                done();
            });

            await waitForExpect(() => expect(done).toBeCalledTimes(1));
            await anotherClient.disconnect();
        });

        it('should notify other users about new user joined', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // target user join the chat
            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

            // another user join the chat
            const anotherClient = await getClientSocketConnection(server.address);
            anotherClient.emit(SocketEventName.join, [anotherUsername] as JoinEventBody);

            // wait for event
            clientSocket.on(SocketEventName.newJoin, (eventBody: NewJoinResponseEventBody) => {
                const [joinedUserName] = eventBody;

                expect(joinedUserName).toBe(anotherUsername);
                done();
            });
            await waitForExpect(() => expect(done).toBeCalledTimes(1));
            await anotherClient.disconnect();
        });

        it('should return all active users in the room', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // another user join the chat
            const anotherClient = await getClientSocketConnection(server.address);
            anotherClient.emit(SocketEventName.join, [anotherUsername] as JoinEventBody);

            // target user join the chat
            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

            // wait for event
            clientSocket.on(SocketEventName.joinResult, (eventBody: JoinResponseEventBody) => {
                const [errorMessage, dialogs] = eventBody;

                if (!dialogs) throw new Error('Dialogs are empty!');
                expect(dialogs.length).toBe(1);
                expect(dialogs[0].unread).toBe(0);
                expect(dialogs[0].from).toBe(anotherUsername);
                expect(errorMessage).toBeFalsy();
                done();
            });
            await waitForExpect(() => expect(done).toBeCalledTimes(1));
            await anotherClient.disconnect();
        });
    });
});
