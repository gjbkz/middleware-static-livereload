import * as http from 'http';
import * as https from 'https';

export const request = async (
    method: string,
    url: URL,
    options?: http.RequestOptions | https.RequestOptions,
    data?: string | Buffer,
): Promise<http.IncomingMessage> => {
    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
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
        )
        .once('response', resolve)
        .once('error', reject)
        .end(data);
    });
    return response;
};
