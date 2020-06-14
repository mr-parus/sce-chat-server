import { CustomError } from './CustomError';

export class WrongArgumentError<T> extends CustomError {
    constructor(public argName: string, public argValue: T, public reason?: string) {
        super(`Wrong argument '${argName}' = ${JSON.stringify(argValue)}. Reason: ${reason}`);
    }
}
