import * as http from 'http';
import * as https from 'https';

export const request = (
    method: string,
    url: URL,
    options?: http.RequestOptions | https.RequestOptions,
    data?: string | Buffer,
): Promise<http.IncomingMessage> => new Promise((resolve, reject) => {
    const httpModule = url.protocol === 'https:' ? https : http;
    httpModule.request(
        {
            ...options,
            method,
            protocol: url.protocol,
            host: url.hostname.replace(/\[|\]/g, ''),
            port: url.port,
            auth: url.username && `${url.username}:${url.password}`,
            path: url.href.split(url.host)[1],
        },
        resolve,
    )
    .once('error', reject)
    .end(data);
});
