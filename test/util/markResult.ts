/* eslint-disable no-console */
import fetch from 'node-fetch';
import type * as selenium from 'selenium-webdriver';
import {browserStack} from './constants';

export const markResult = async (
    session: selenium.Session,
    passed: boolean,
): Promise<void> => {
    if (browserStack) {
        const endpoint = new URL('https://api.browserstack.com');
        endpoint.pathname = `/automate/sessions/${session.getId()}.json`;
        endpoint.username = browserStack.userName;
        endpoint.password = browserStack.accessKey;
        const res = await fetch(endpoint.href, {
            method: 'PUT',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({status: passed ? 'passed' : 'failed'}),
        });
        console.log(`${res.status} ${res.statusText}`);
        console.log(await res.text());
    } else {
        console.log('markResult:Skipped');
    }
};
