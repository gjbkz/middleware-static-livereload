export const toDirUrl = (url: URL): URL => {
	if (!url.pathname.endsWith("/")) {
		url.pathname = `${url.pathname}/`;
	}
	return url;
};
