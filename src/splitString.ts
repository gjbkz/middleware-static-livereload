/**
 * @example splitString('Hello,, world!', /,/) → ['Hello', '', ' world!']
 */
export const splitString = function* (input: string, pattern: RegExp) {
	let lastIndex = 0;
	for (const match of input.matchAll(pattern)) {
		yield input.slice(lastIndex, match.index);
		lastIndex = match.index + match[0].length;
	}
	yield input.slice(lastIndex);
};
