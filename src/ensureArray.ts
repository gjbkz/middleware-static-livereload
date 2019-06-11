export const ensureArray = <TType>(
    input: TType | Array<TType>,
): Array<TType> => {
    if (Array.isArray(input)) {
        return input.slice();
    }
    return [input];
};
