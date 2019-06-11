import {IEvent} from '../types';

export const parseEvents = (
    events: string | Buffer,
): Array<IEvent> => `${events}`.split('\n\n')
.map(parseEvent)
.filter((event) => 0 < Object.keys(event).length);

export const parseEvent = (
    event: string | Buffer,
): IEvent => `${event}`.split('\n').reduce<IEvent>(
    (event, line) => {
        const [key, value] = line.split(/\s*:\s*/);
        if (key && value) {
            event[key] = value;
        }
        return event;
    },
    {},
);
