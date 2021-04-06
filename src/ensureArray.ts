export const ensureArray = <TType>(
    input: Array<TType> | TType,
): Array<TType> => {
    if (Array.isArray(input)) {
        return input.slice();
    }
    return [input];
};
