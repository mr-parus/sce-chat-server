import { IMessage, MessageParams } from './IMessage';
import { IUser } from './IUser';

type ErrorMessage = string;
type ConfirmationHash = string;
type Token = string;
type OnlineUsers = IUser[];

// incoming messages
export type JoinByUsernameEventBody = [IUser['username']];
export type JoinByTokenEventBody = [null, Token];
export type JoinEventBody = JoinByTokenEventBody | JoinByUsernameEventBody;
export type SendMessageEventBody = [MessageParams, Token, ConfirmationHash];
export type SocketIncomingEventBody = JoinEventBody | SendMessageEventBody;

// outgoing messages
export type DisconnectEventBody = [IUser];
export type JoinResultEventBody = [ErrorMessage] | [0, IUser, OnlineUsers, Token];
export type NewJoinResponseEventBody = [IUser];
export type ReceiveMessageEventBody = [IMessage];
export type SendMessageResultEventBody =
    | [ErrorMessage, ConfirmationHash]
    | [0, ConfirmationHash, IMessage['id'], IMessage['sentAt']];
