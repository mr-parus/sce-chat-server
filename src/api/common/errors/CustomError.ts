export abstract class CustomError extends Error {
    name = this.constructor.name;

    constructor(message: string) {
        super(message);
        this.message = message;
    }
}
