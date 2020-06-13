import waitForExpect from 'wait-for-expect';

import { Server } from '../../../../src/server/Server';
import SocketIOClient from 'socket.io-client';
import { config } from '../../../../src/config';
import { SocketEventName } from '../../../../src/api/common/types/SocketEventName';
import { socketEventHandlers } from '../../../../src/api/users/socketEventHandlers';
import { getClientSocketConnection } from '../../../../src/utils/getClientSocketConnection';
import { connect as connectToMongoDB } from '../../../../src/utils/mongo';
import mongoose from 'mongoose';
import { User } from '../../../../src/api/users/models/User';
import { IMessage } from '../../../../src/api/common/types/IMessage';
import { ReceiveMessageEventBody, SendMessageResultEventBody } from '../../../../src/api/common/types/SocketEventBody';

describe('sendMessage (socket event handler)', () => {
    let server: Server;
    let mongoConnection: mongoose.Mongoose;

    let targetClient: SocketIOClient.Socket;
    let anotherClient: SocketIOClient.Socket;

    const targetUsername = 'Bob';
    const anotherUsername = 'Alice';

    const message: IMessage = {
        from: targetUsername,
        to: anotherUsername,
        sentAt: Date.now(),
        text: `Hi ${anotherUsername}!`,
    };

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

    it('should deny messages from users who are not in the chat', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user sends the message
        const done = jest.fn();
        targetClient.emit(SocketEventName.sendMessage, [message]);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SendMessageResultEventBody) => {
            const [errorMessage] = eventBody;
            expect(errorMessage).toBe('Firstly you should join the chat!');
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny messages to not existing users', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins to the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername]);
        targetClient.on(SocketEventName.joinResult, done);
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message]);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SendMessageResultEventBody) => {
            const [errorMessage] = eventBody;
            expect(errorMessage).toBe('There is not such user in the system!');
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deliver a message to the server', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername]);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername]);
        anotherClient.on(SocketEventName.joinResult, done);

        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message]);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SendMessageResultEventBody) => {
            const [errorMessage] = eventBody;
            expect(errorMessage).toBe(0);
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        await anotherClient.disconnect();
    });

    it('should deliver a message to the receiver', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername]);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername]);
        anotherClient.on(SocketEventName.joinResult, done);

        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message]);

        // wait for event
        anotherClient.on(SocketEventName.receiveMessage, (eventBody: ReceiveMessageEventBody) => {
            const [receivedMessage] = eventBody;
            expect(message).toEqual(receivedMessage);
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        await anotherClient.disconnect();
    });
});
