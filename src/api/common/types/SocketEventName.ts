export enum SocketEventName {
    // incoming messages
    join = 'j', // when a new user joins
    sendMessage = 'sm', // when a user sends a message
    getMessages = 'gm', // when a user requests messages

    // outgoing messages
    disconnect = 'd', // when server notifies connected users about user disconnection
    getMessagesResult = 'gmr', // result of getting messages
    joinResult = 'jr', // result of the join
    newJoin = 'nj', // when server notifies connected users about new join
    receiveMessage = 'rm', // when server sends a message to receiver
    sendMessageResult = 'smr', // when server responds about receiving a message
}
