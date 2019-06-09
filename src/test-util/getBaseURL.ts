import * as net from 'net';
import {URL} from 'url';

export const getBaseURL = (
    addressInfo: ReturnType<typeof net.Server.prototype.address>,
): URL => {
    if (typeof addressInfo === 'object' && addressInfo) {
        const {address, family, port} = addressInfo;
        const hostname = family === 'IPv6' ? `[${address}]` : address;
        return new URL(`http://${hostname}:${port}`);
    }
    throw new Error(`Invalid address: ${addressInfo}`);
};
