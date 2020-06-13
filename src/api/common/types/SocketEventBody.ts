import { IMessage } from './IMessage';
import { IUser } from './IUser';

type ErrorMessage = string;
type Token = string;
type OnlineUsers = IUser[];

// incoming messages
export type JoinEventBody = [IUser['username']];
export type SendMessageEventBody = [IMessage, Token?];
export type SocketEventBody = JoinEventBody | SendMessageEventBody;

// outgoing messages
export type DisconnectEventBody = [IUser];
export type JoinResultEventBody = [ErrorMessage] | [0, IUser, OnlineUsers, Token];
export type NewJoinResponseEventBody = [IUser];
export type ReceiveMessageEventBody = [IMessage];
export type SendMessageResultEventBody = [ErrorMessage] | [0];
