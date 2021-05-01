let eventId = 0;

export const compileEvent = (data: string, eventName?: string) => {
    const eventData = data.trim().split(/\r\n|\r|\n/).map((line) => `data: ${line}`);
    if (eventName) {
        eventData.unshift(`event: ${eventName}`);
    }
    eventData.unshift(`id: ${eventId++}`);
    return `${eventData.join('\n')}\n\n`;
};
