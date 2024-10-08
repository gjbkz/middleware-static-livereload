/* eslint-disable */
(function () {
  /**
   * removes parameters from given URL.
   * @param {string} inputPathWithParameters
   */
  function removeParameters(inputPathWithParameters) {
    return inputPathWithParameters.replace(/^([^?#]*).*?$/, '$1');
  }
  /**
   * returns true if the input is an absolute path.
   * @param {string} inputPath
   */
  function isAbsolute(inputPath) {
    return inputPath[0] === '/';
  }
  /**
   * returns "foo/bar" if the input is "foo/bar/baz"
   * @param {string} input
   */
  function dirname(input) {
    return input.replace(/^(.*)\/.*?$/, '$1');
  }
  /**
   * returns ".html" if the input is "foo/bar/baz.html"
   * @param {string} input
   */
  function extname(input) {
    return input.replace(/^.*\./, '.');
  }
  /**
   * convert relative pathname to absolute one
   * @param {string} inputPathname
   */
  function absolutify(inputPathname) {
    const pathname = removeParameters(inputPathname);
    if (isAbsolute(pathname)) {
      return pathname;
    }
    return dirname(location.pathname) + '/' + pathname;
  }
  /**
   * handles "change" events
   * @param {Object} event
   * @param {string} event.data relative file path
   */
  function onChange(event) {
    const pathname = event.data;
    if (extname(pathname) === '.css') {
      const selector = 'link[rel="stylesheet"][href*="' + pathname + '"]';
      const element = document.querySelector(selector);
      if (element) {
        const absolutePath = absolutify(element.getAttribute('href'));
        element.setAttribute('href', absolutePath + '?reload=' + Date.now());
      }
    } else {
      location.reload();
    }
  }
  /**
   * handles "error" events
   * @param {Object} event
   */
  function onError(event) {
    console.error(event);
  }
  const scriptElement = document.querySelector('#middleware-static-livereload');
  const src = scriptElement && scriptElement.getAttribute('src');
  const endpoint = src && src + '/connect';
  if (!endpoint) {
    throw new Error('Failed to get the livereload endpoint');
  }
  const eventSource = new EventSource(endpoint);
  eventSource.addEventListener('error', onError);
  eventSource.addEventListener('add', onChange);
  eventSource.addEventListener('change', onChange);
  eventSource.addEventListener('unlink', onChange);
})();
