export interface SplitResult {
    value: string,
    start: number,
    end: number,
    next: number,
}

export const splitString = function* (
    input: string,
    separator: string,
): Generator<SplitResult> {
    if (separator.length === 0) {
        return;
    }
    let start = 0;
    const {length} = input;
    while (start < length) {
        let end = input.indexOf(separator, start);
        let next = end + separator.length;
        if (end < 0) {
            end = next = length;
        }
        yield {
            value: input.slice(start, end),
            start,
            end,
            next,
        };
        start = next;
    }
};
