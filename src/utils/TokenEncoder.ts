import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import { config } from '../config';
import { InvalidJWTTokenError } from '../api/modules/common/errors/InvalidJWTTokenError';
import { IUser } from '../api/modules/common/types/IUser';
import { log } from './logger';

const jwtSecret = config.get('JWT_SECRET');

export class TokenEncoder {
    static async encode(id: IUser['id']): Promise<string> {
        return jwt.sign({ id }, jwtSecret);
    }

    static async decode(token: string): Promise<IUser['id']> {
        try {
            const { id } = (await promisify(jwt.verify)(token, jwtSecret)) as { id: string };
            return id;
        } catch (e) {
            log.error(e);
            throw new InvalidJWTTokenError(token);
        }
    }
}
