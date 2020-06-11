type Username = string;
type UserID = string;
type ErrorMessage = string;

export type JoinEventBody = [Username];
export type SocketEventBody = JoinEventBody;

export type JoinResponseEventBody = [ErrorMessage | 0];
export type NewJoinEventBody = [Username, UserID];
