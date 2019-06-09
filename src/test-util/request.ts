import * as http from 'http';
import * as https from 'https';

export const request = async (
    method: string,
    url: URL,
    options?: http.RequestOptions | https.RequestOptions,
    data?: string | Buffer,
): Promise<http.IncomingMessage> => new Promise((resolve, reject) => {
    const httpModule = url.protocol === 'https:' ? https : http;
    httpModule.request(url, {...options, method}, resolve)
    .once('error', reject)
    .end(data);
});
