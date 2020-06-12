import { IDialog } from './IDialog';
import { IMessage } from './IMessage';

type ErrorMessage = string;
type Username = string;

// incoming messages
export type JoinEventBody = [Username];
export type SendMessageEventBody = [IMessage];
export type SocketEventBody = JoinEventBody | SendMessageEventBody;

// outgoing messages
export type DisconnectEventBody = [Username];
export type JoinResultEventBody = [ErrorMessage | 0, IDialog[]?];
export type NewJoinResponseEventBody = [Username];
export type ReceiveMessageEventBody = [IMessage];
export type SendMessageResultEventBody = [ErrorMessage | 0];
