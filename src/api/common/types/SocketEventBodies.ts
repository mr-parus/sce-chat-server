import { Dialog } from './Dialog';
import { User } from './User';

type ErrorMessage = string;

export type JoinEventBody = [User['username']];
export type SocketEventBodies = JoinEventBody;

export type JoinResponseEventBody = [ErrorMessage | 0, Dialog[]?];
export type NewJoinResponseEventBody = [User['username']];
