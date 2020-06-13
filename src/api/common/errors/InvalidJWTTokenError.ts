import { CustomError } from './CustomError';

export class InvalidJWTTokenError extends CustomError {
    constructor(public token: string) {
        super(`Provided token is invalid! Token: ${token}`);
    }
}
