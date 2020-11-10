export const parseEvents = (
    events: string | Buffer,
): Array<Record<string, string>> => `${events}`.split('\n\n')
.map(parseEvent)
.filter((event) => 0 < Object.keys(event).length);

export const parseEvent = (
    eventLog: string | Buffer,
): Record<string, string> => `${eventLog}`.split('\n').reduce<Record<string, string>>(
    (event, line) => {
        const [key, value] = line.split(/\s*:\s*/);
        if (key && value) {
            event[key] = value;
        }
        return event;
    },
    {},
);
