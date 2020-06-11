import waitForExpect from 'wait-for-expect';

import { Server } from '../../src/server/Server';
import SocketIOClient from 'socket.io-client';
import { config } from '../../src/config';
import { SocketEventName } from '../../src/api_socket/types/SocketEventName';
import { socketEventHandlers } from '../../src/api_socket/eventHandlers';
import { JoinEventBody, JoinResponseEventBody, NewJoinEventBody } from '../../src/api_socket/types/SocketEventBody';
import { getClientSocketConnection } from '../utils/getClientSocketConnection';

describe('API (socket)', () => {
    let server: Server;
    let clientSocket: SocketIOClient.Socket;
    const targetUsername = 'Bob';
    const anotherUsername = 'Alice';

    // Setup WS & HTTP servers
    beforeAll(async () => {
        server = new Server();
        server.socketEventHandlers = socketEventHandlers;
        await server.listen(config.get('SERVER_PORT'));
    });

    // Cleanup WS & HTTP servers
    afterAll(async () => {
        await server.close();
    });

    beforeEach(async () => {
        clientSocket = await getClientSocketConnection(server.address);
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) clientSocket.disconnect();
    });

    describe('joinChat', () => {
        it('should join new user to chat', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            clientSocket.on(SocketEventName.joinResponse, (eventBody: JoinResponseEventBody) => {
                const errorMessage = eventBody[0];
                expect(errorMessage).toBeFalsy();
                done();
            });

            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);

            await waitForExpect(() => {
                expect(done).toBeCalledTimes(1);
            });
        });

        it('should notify other users about new user joined', async () => {
            expect(clientSocket.connected).toEqual(true);

            const done = jest.fn();

            // target user join
            clientSocket.emit(SocketEventName.join, [targetUsername] as JoinEventBody);
            clientSocket.on(SocketEventName.newJoin, (eventBody: NewJoinEventBody) => {
                const [joinedUserName, joinedUserId] = eventBody;
                expect(joinedUserName).toBe(anotherUsername);
                expect(typeof joinedUserId).toBe('string');
                done();
            });

            // another user join
            const anotherClient = await getClientSocketConnection(server.address);
            anotherClient.emit(SocketEventName.join, [anotherUsername] as JoinEventBody);

            await waitForExpect(() => {
                expect(done).toBeCalledTimes(1);
            });

            await anotherClient.disconnect();
        });
    });
});
