import { IUser } from './IUser';

export interface IMessage {
    from: IUser['id'];
    to: IUser['id'];
    text: string;
    sentAt: number;
}
