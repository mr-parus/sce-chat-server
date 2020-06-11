import SocketIOClient from 'socket.io-client';
import { AddressInfo } from 'net';

export const getClientSocketConnection = async (serverAddress: AddressInfo): Promise<SocketIOClient.Socket> => {
    const { address, port } = serverAddress;
    const clientSocket = SocketIOClient.connect(`http://[${address}]:${port}`, {
        reconnectionDelay: 0,
        forceNew: true,
    });

    await new Promise((r) => clientSocket.on('connect', r));

    return clientSocket;
};
