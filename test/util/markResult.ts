/* eslint-disable no-console */
import type * as http from 'http';
import * as https from 'https';
import type * as selenium from 'selenium-webdriver';
import {browserStack} from './constants.ts';

export const markResult = async (
    session: selenium.Session,
    passed: boolean,
): Promise<void> => {
    if (browserStack) {
        const endpoint = new URL('https://api.browserstack.com');
        endpoint.pathname = `/automate/sessions/${session.getId()}.json`;
        endpoint.username = browserStack.userName;
        endpoint.password = browserStack.accessKey;
        const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
            const req = https.request(endpoint, {
                method: 'PUT',
                headers: {'content-type': 'application/json'},
            }, resolve);
            req.once('error', reject);
            req.end(JSON.stringify({status: passed ? 'passed' : 'failed'}));
        });
        console.log(`${res.statusCode} ${res.statusMessage}`);
        for await (const chunk of res) {
            console.log(`${chunk}`);
        }
    } else {
        console.log('markResult:Skipped');
    }
};
