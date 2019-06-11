const timerId = setInterval(function () {
    document.title = 'passed: test-1';
    const style = getComputedStyle(document.body);
    if (style.getPropertyValue('animation-name') === 'test-2') {
        document.title = 'passed: test-2';
        clearInterval(timerId);
    }
}, 100);
