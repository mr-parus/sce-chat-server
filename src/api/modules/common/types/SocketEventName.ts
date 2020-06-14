export enum SocketEventName {
    // Incoming events
    getMessages = 'gm', // when a user restores messages for a dialog
    join = 'j', // when a new user joins the chat
    read = 'r', // when a user read all messages from a dialog
    sendMessage = 'sm', // when a user sends a message

    // Outgoing events
    disconnect = 'd', // notify connected users about user disconnection
    getMessagesResult = 'gmr', // respond with all messages from a dialog
    interlocutorReadDialog = 'ird', // notify a user that his message was read
    joinResult = 'jr', // return a result of the join
    newJoin = 'nj', // notify connected users about new user joins the chat
    receiveMessage = 'rm', // deliver a message to receiver
    sendMessageResult = 'smr', // respond about a message was delivered to server
}
