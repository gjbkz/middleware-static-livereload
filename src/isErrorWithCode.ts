export const isErrorWithCode = (
	value: unknown,
): value is Error & { code: string } =>
	value instanceof Error && "code" in value && typeof value.code === "string";
