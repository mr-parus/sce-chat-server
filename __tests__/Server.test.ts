import SocketIOClient from 'socket.io-client';
import { Server } from '../src/server/Server';
import waitForExpect from 'wait-for-expect';
import { config } from '../src/config';

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

    beforeEach((done) => {
        const { address, port } = server.address;
        clientSocket = SocketIOClient.connect(`http://[${address}]:${port}`, { reconnectionDelay: 0, forceNew: true });
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket.connected) clientSocket.disconnect();
    });

    describe('Socket', () => {
        describe('Security', () => {
            it('should disconnect clients who send nonexistent events', async () => {
                expect(clientSocket.connected).toEqual(true);

                clientSocket.emit('Hello', 'World');

                await waitForExpect(() => {
                    expect(clientSocket.connected).toEqual(false);
                });
            });
        });
    });
});
