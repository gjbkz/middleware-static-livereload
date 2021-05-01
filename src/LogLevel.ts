export const LogLevel = {
    debug: 0,
    info: 1,
    error: 2,
    silent: 3,
} as const;
export type LogLevel = 0 | 1 | 2 | 3;
