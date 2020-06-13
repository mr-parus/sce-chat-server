import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../api/common/types/IUser';
import { promisify } from 'util';
import { InvalidJWTTokenError } from '../api/common/errors/InvalidJWTTokenError';

export class TokenEncoder {
    static async encode(id: IUser['id']): Promise<string> {
        return jwt.sign({ id }, config.get('JWT_SECRET'));
    }

    static async decode(token: string): Promise<IUser['id']> {
        try {
            const { id } = (await promisify(jwt.verify)(token, config.get('JWT_SECRET'))) as { id: string };
            return id;
        } catch (e) {
            throw new InvalidJWTTokenError(token);
        }
    }
}
