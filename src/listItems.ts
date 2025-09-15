export const listItems = function* <T>(input: Array<T> | T): Generator<T> {
	if (Array.isArray(input)) {
		for (const item of input) {
			yield item;
		}
	} else {
		yield input;
	}
};
