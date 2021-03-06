import { IMessage, MessageParams } from './IMessage';
import { IUser } from './IUser';

type ConfirmationHash = string;
type ErrorMessage = string;
type Token = string;

// Incoming messages
export type GetMessages = [IUser['id'], Token];
export type Join = JoinByToken | JoinByUsername;
export type JoinByToken = [null, Token];
export type JoinByUsername = [IUser['username']];
export type ReadDialog = [IUser['id'], Token];
export type SendMessage = [MessageParams, Token, ConfirmationHash];

// Outgoing messages
export type Disconnect = [IUser];
export type GetMessagesResult = [ErrorMessage] | [0, IUser['id'], IMessage[]];
export type InterlocutorReadDialog = [IUser['id']];
export type JoinResult = [0, IUser, IUser[] /*online users*/, Token] | [ErrorMessage];
export type NewJoinResponse = [IUser];
export type ReceiveMessage = [IMessage];
export type SendMessageResult =
    | [0, ConfirmationHash, IMessage['id'], IMessage['sentAt']]
    | [ErrorMessage, ConfirmationHash];
