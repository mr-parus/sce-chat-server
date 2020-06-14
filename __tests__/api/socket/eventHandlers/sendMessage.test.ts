import mongoose from 'mongoose';
import SocketIOClient from 'socket.io-client';
import waitForExpect from 'wait-for-expect';
import { v4 as uuidV4 } from 'uuid';

import * as SocketEvent from '../../../../src/api/modules/common/types/SocketEvent';
import { config } from '../../../../src/config';
import { connect as connectToMongoDB } from '../../../../src/utils/mongo';
import { getClientSocketConnection } from '../../../../src/utils/getClientSocketConnection';
import { IUser } from '../../../../src/api/modules/common/types/IUser';
import { Message } from '../../../../src/api/modules/messages/models/Message';
import { MessageParams } from '../../../../src/api/modules/common/types/IMessage';
import { saveUserIfNotExists } from '../../../../src/api/modules/users/services/saveUserIfNotExists';
import { Server } from '../../../../src/server/Server';
import { socketEventHandlers } from '../../../../src/api/socket/eventHandlers';
import { SocketEventName } from '../../../../src/api/modules/common/types/SocketEventName';
import { TokenEncoder } from '../../../../src/utils/TokenEncoder';
import { User } from '../../../../src/api/modules/users/models/User';

describe('sendMessage (socket event handler)', () => {
    let server: Server;
    let mongoConnection: mongoose.Mongoose;

    let targetClient: SocketIOClient.Socket;
    let anotherClient: SocketIOClient.Socket;

    let user1: IUser, user2: IUser;
    const targetUsername = 'Bob';
    const anotherUsername = 'Alice';

    let message: MessageParams;
    let token: string;
    let confirmationHash: string;

    beforeAll(async () => {
        mongoConnection = await connectToMongoDB();
        server = Server.ofConfig(config);
        server.socketEventHandlers = socketEventHandlers;
        await server.listen();

        [user1, user2] = await Promise.all([
            saveUserIfNotExists({ username: targetUsername }),
            saveUserIfNotExists({ username: anotherUsername }),
        ]);

        token = await TokenEncoder.encode(user1.id);
    });

    afterAll(async () => {
        await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
        await server.close();
        await mongoConnection.disconnect();
    });

    beforeEach(async () => {
        targetClient = await getClientSocketConnection(server.address);

        message = {
            from: user1.id,
            to: user2.id,
            text: `Hi ${anotherUsername}!`,
        };

        confirmationHash = uuidV4();
    });

    afterEach(async () => {
        if (targetClient?.connected) await targetClient.disconnect();
        if (anotherClient?.connected) await anotherClient.disconnect();
    });

    it('should deny messages from unauthorised users', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user sends the message
        const done = jest.fn();
        targetClient.emit(SocketEventName.sendMessage, [
            message,
            'bad token',
            confirmationHash,
        ] as SocketEvent.SendMessage);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SocketEvent.SendMessageResult) => {
            const [errorMessage, receivedConfirmationHash] = eventBody;
            expect(errorMessage).toBe('Not authorised!');
            expect(confirmationHash).toEqual(receivedConfirmationHash);
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deny messages to not existing users', async () => {
        expect(targetClient.connected).toEqual(true);

        message.to = mongoose.Types.ObjectId().toHexString();

        // target user joins to the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);
        targetClient.on(SocketEventName.joinResult, (eventBody: SocketEvent.JoinResult) => {
            expect(eventBody[0]).toBeFalsy();
            done();
        });
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message, token, confirmationHash] as SocketEvent.SendMessage);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SocketEvent.SendMessageResult) => {
            const [errorMessage, receivedConfirmationHash] = eventBody;
            expect(errorMessage).toBe('There is not such user in the system!');
            expect(confirmationHash).toEqual(receivedConfirmationHash);
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));
    });

    it('should deliver a message to the server', async () => {
        expect(targetClient.connected).toEqual(true);

        // target user joins the chat
        const done = jest.fn();
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername] as SocketEvent.Join);
        anotherClient.on(SocketEventName.joinResult, done);

        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message, token, confirmationHash] as SocketEvent.SendMessage);

        // wait for event
        targetClient.on(SocketEventName.sendMessageResult, (eventBody: SocketEvent.SendMessageResult) => {
            const [errorMessage, receivedConfirmationHash, receivedMessageId, receivedSentAt] = eventBody;
            expect(errorMessage).toBe(0);
            expect(typeof receivedSentAt).toEqual('string');
            expect(typeof receivedMessageId).toEqual('string');
            expect(confirmationHash).toEqual(receivedConfirmationHash);
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
        targetClient.emit(SocketEventName.join, [targetUsername] as SocketEvent.Join);
        targetClient.on(SocketEventName.joinResult, done);

        // another user joins the chat
        const anotherClient = await getClientSocketConnection(server.address);
        anotherClient.emit(SocketEventName.join, [anotherUsername] as SocketEvent.Join);
        anotherClient.on(SocketEventName.joinResult, done);

        await waitForExpect(() => expect(done).toBeCalledTimes(2));

        // target user sends the message
        targetClient.emit(SocketEventName.sendMessage, [message, token, confirmationHash] as SocketEvent.SendMessage);

        // wait for event
        anotherClient.on(SocketEventName.receiveMessage, (eventBody: SocketEvent.ReceiveMessage) => {
            const [receivedMessage] = eventBody;
            expect(message.from).toEqual(receivedMessage.from);
            expect(message.to).toEqual(receivedMessage.to);
            expect(message.text).toEqual(receivedMessage.text);
            expect(typeof receivedMessage.sentAt).toEqual('string');
            expect(typeof receivedMessage.id).toEqual('string');
            done();
        });
        done.mockReset();
        await waitForExpect(() => expect(done).toBeCalledTimes(1));

        await anotherClient.disconnect();
    });
});
