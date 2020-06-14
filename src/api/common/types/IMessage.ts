import { IUser } from './IUser';

export interface IMessage {
    from: IUser['id'];
    id: string;
    sentAt: string;
    text: string;
    to: IUser['id'];
}

export interface MessageParams {
    from: IUser['id'];
    text: string;
    to: IUser['id'];
}
