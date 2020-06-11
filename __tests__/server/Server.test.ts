import SocketIOClient from 'socket.io-client';

import { Server } from '../../src/server/Server';

import waitForExpect from 'wait-for-expect';
import { config } from '../../src/config';
import { getClientSocketConnection } from '../utils/getClientSocketConnection';
import { log } from '../../src/utils/logger';

describe('Server', () => {
    let server: Server;
    let clientSocket: SocketIOClient.Socket;

    // Setup WS & HTTP servers
    beforeAll(async () => {
        server = new Server();
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
        jest.clearAllMocks();
        if (clientSocket && clientSocket.connected) clientSocket.disconnect();
    });

    describe('Socket', () => {
        describe('Security', () => {
            it('should disconnect clients who send nonexistent events', async () => {
                expect(clientSocket.connected).toEqual(true);

                // for checking that unexpected behaviour has logged
                const mockLogError = jest.fn();
                log.error = mockLogError;

                clientSocket.emit('Hello', 'World');

                await waitForExpect(() => {
                    expect(clientSocket.connected).toEqual(false);
                    expect(mockLogError.mock.calls[0][0]).toContain('Unexpected event');
                });
            });
        });
    });
});
