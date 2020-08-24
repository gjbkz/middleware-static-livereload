export const LogLevel = {
    debug: 0 as const,
    info: 1 as const,
    error: 2 as const,
    silent: 3 as const,
};
type LogLevels = typeof LogLevel;
export type LogLevel = LogLevels[keyof LogLevels];
