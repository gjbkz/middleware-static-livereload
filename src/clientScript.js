/** biome-ignore-all lint/complexity/useOptionalChain: compatibility */
(() => {
	/**
	 * @param {Object} event
	 * @param {string} event.data relative file path
	 */
	const onChange = (event) => {
		const changedFileUrl = new URL(`/${event.data}`, location.href);
		if (changedFileUrl.pathname.endsWith(".css")) {
			for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
				if (link.href) {
					const cssUrl = new URL(link.href, location.href);
					if (changedFileUrl.pathname === cssUrl.pathname) {
						cssUrl.searchParams.set("reload", Date.now());
						const cloned = link.cloneNode();
						cloned.href = cssUrl.href;
						link.after(cloned);
						link.remove();
						return;
					}
				}
			}
		}
		location.reload();
	};
	/** @param {Object} event */
	const onError = (event) => console.error(event);
	const scriptElement = document.querySelector("#middleware-static-livereload");
	const src = scriptElement && scriptElement.getAttribute("src");
	const endpoint = src && `${src}/connect`;
	if (!endpoint) {
		throw new Error("Failed to get the livereload endpoint");
	}
	const eventSource = new EventSource(endpoint);
	eventSource.addEventListener("error", onError);
	eventSource.addEventListener("change", onChange);
	globalThis.liveReload = { endpoint, scriptElement, eventSource };
})();
