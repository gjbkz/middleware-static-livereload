import {splitString} from './splitString.ts';

export const parseEventLine = (
    eventLine: string,
    keyValueSeparator: string,
): [string, string] | null => {
    const result = splitString(eventLine, keyValueSeparator).next();
    if (!result.done) {
        const splitResult = result.value;
        const key = splitResult.value.trim();
        if (key) {
            const value = eventLine.slice(splitResult.next).trim();
            if (value) {
                return [key, value];
            }
        }
    }
    return null;
};

export const parseEventLines = function* (
    eventLines: string,
    lineBreak: string,
    keyValueSeparator: string,
): Generator<[string, string]> {
    for (const eventLine of splitString(eventLines, lineBreak)) {
        const pair = parseEventLine(eventLine.value, keyValueSeparator);
        if (pair) {
            yield pair;
        }
    }
};

export const parseEvents = function* (
    receivedMessage: string,
    lineBreak = '\n',
    eventSeparator = `${lineBreak}${lineBreak}`,
    keyValueSeparator = ':',
): Generator<Record<string, string>> {
    for (const eventLines of splitString(receivedMessage, eventSeparator)) {
        const event: Record<string, string> = {};
        for (const [key, value] of parseEventLines(eventLines.value, lineBreak, keyValueSeparator)) {
            event[key] = value;
        }
        yield event;
    }
};
