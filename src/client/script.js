(
    function (global, callback) {
        const document = global.document;
        const scriptElement = document.querySelector('#middleware-static-livereload');
        const src = scriptElement && scriptElement.getAttribute('src');
        const endpoint = src && src + '/connect';
        if (!endpoint) {
            throw new Error('Failed to get the livereload endpoint');
        }
        let loading = false;
        function getEventSource() {
            if (global.EventSource) {
                callback(endpoint, global);
            } else if (!loading) {
                const polyfillElement = document.createElement('script');
                polyfillElement.src = src + '/polyfill.js';
                polyfillElement.onload = getEventSource;
                scriptElement.parentElement.appendChild(polyfillElement);
                loading = true;
            }
        }
        getEventSource();
    }(
        self || window,
        /**
         * @param {string} endpoint
         * @param {Window} global
         */
        function (endpoint, global) {
            function absolutify(input) {
                const pathname = input.replace(/([^?#]*).*?$/, '$1');
                if (pathname[0] === '/') {
                    return pathname;
                }
                const currentPathname = location.pathname.replace(/([^?#]*\/).*?$/, '$1');
                return currentPathname + pathname;
            }
            function onChange(event) {
                const pathname = event.data;
                const extension = pathname.replace(/.*\./, '');
                if (extension === 'css') {
                    const selector = 'link[rel="stylesheet"][href*="' + pathname + '"]';
                    const element = global.document.querySelector(selector);
                    if (element) {
                        const pathname = absolutify(element.getAttribute('href'));
                        element.setAttribute('href', pathname + '?reload=' + Date.now());
                    }
                } else {
                    global.location.reload();
                }
            }
            function onError(event) {
                global.console.error(event.error || event);
            }
            const eventSource = new global.EventSource(endpoint);
            eventSource.addEventListener('error', onError);
            eventSource.addEventListener('change', onChange);
            eventSource.addEventListener('unlink', onChange);
        }
    )
);
