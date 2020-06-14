export abstract class CustomError extends Error {
    name = this.constructor.name;

    protected constructor(message: string) {
        super(message);
        this.message = message;
    }
}
