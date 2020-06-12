import waitForExpect from 'wait-for-expect';

import { Server } from '../../../../src/server/Server';
import SocketIOClient from 'socket.io-client';
import { config } from '../../../../src/config';
import { SocketEventName } from '../../../../src/api/common/types/SocketEventName';
import { socketEventHandlers } from '../../../../src/api/users/socketEventHandlers';
import {
    DisconnectEventBody,
    JoinEventBody,
    JoinResultEventBody,
    NewJoinResponseEventBody,
} from '../../../../src/api/common/types/SocketEventBody';
import { getClientSocketConnection } from '../../../../src/utils/getClientSocketConnection';
import { connect as connectToMongoDB } from '../../../../src/utils/mongo';
import mongoose from 'mongoose';
import { User } from '../../../../src/api/users/models/User';

describe('joinChat (socket event handler)', () => {
    let server: Server;
    let mongoConnection: mongoose.Mongoose;

    let targetClient: SocketIOClient.Socket;
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
        await User.deleteMany({});
        await mongoConnection.disconnect();
        await server.close();
    });

    beforeEach(async () => {
        targetClient = await getClientSocketConnection(server.address);
    });

    afterEach(async () => {
        if (targetClient && targetClient.connected) await targetClient.disconnect();
        if (anotherClient && anotherClient.connected) await anotherClient.disconnect();
    });

    it('should join new user to chat', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: JoinResultEventBody) => {
            const [errorMessage] = eventBody;

            expect(errorMessage).toBeFalsy();
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if username is too long (>20)', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, ['X'.repeat(21)] as JoinEventBody);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: JoinResultEventBody) => {
            const [errorMessage] = eventBody;

            expect(errorMessage).toBe('Username is too long');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if username is too short (<2)', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, ['X'] as JoinEventBody);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: JoinResultEventBody) => {
            const [errorMessage] = eventBody;

            expect(errorMessage).toBe('Username is too short');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny if user with such username is already connected', async () => {
        expect(targetClient.connected).toEqual(true);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

        // target user joins the chat with the same username
        targetClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: JoinResultEventBody) => {
            const [errorMessage] = eventBody;
            expect(errorMessage).toContain('A user with such username is already in the chat!');
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
        await anotherClient.disconnect();
    });

    it('should notify other users about new user joined', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

        // another 3 users join the chat
        const anotherClients = await Promise.all([
            getClientSocketConnection(server.address),
            getClientSocketConnection(server.address),
            getClientSocketConnection(server.address),
        ]);
        anotherClients.forEach((client, i) => client.emit(SocketEventName.join, [anotherUsername + i]));

        // wait for all events
        const newUsers = {
            [anotherUsername + '0']: 0,
            [anotherUsername + '1']: 0,
            [anotherUsername + '2']: 0,
        };
        targetClient.on(SocketEventName.newJoin, (eventBody: NewJoinResponseEventBody) => {
            const [joinedUserName] = eventBody;
            newUsers[joinedUserName] = 1;
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

    it('should return all active users in the room', async () => {
        expect(targetClient.connected).toEqual(true);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername] as JoinEventBody);

        // target user joins the chat
        targetClient.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

        // wait for event
        const done = jest.fn();
        targetClient.on(SocketEventName.joinResult, (eventBody: JoinResultEventBody) => {
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

    it('should notify if a user disconnected', async () => {
        // target user joins the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername]);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername]);
        anotherClient.on(SocketEventName.joinResult, done);
        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // wait for event
        targetClient.on(SocketEventName.disconnect, (eventBody: DisconnectEventBody) => {
            const [disconnectedUsername] = eventBody;
            expect(disconnectedUsername).toBe(anotherUsername);
            done();
        });
        await anotherClient.disconnect();
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });
});
