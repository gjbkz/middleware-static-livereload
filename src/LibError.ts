export class LibError extends Error {

    public code?: string;

    public constructor(
        code?: string,
        message?: string,
    ) {
        super(message ? `${code}: ${message}` : code);
        this.code = code;
    }

}
