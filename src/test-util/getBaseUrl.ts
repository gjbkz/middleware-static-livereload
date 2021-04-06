import {URL} from 'url';
import type {AddressInfo, Server} from 'net';

export const getBaseUrl = (
    addressInfo: AddressInfo | string | null,
    pathname = '/',
): URL => {
    if (typeof addressInfo === 'object' && addressInfo) {
        const {address, family, port} = addressInfo;
        const hostname = family === 'IPv6' ? `[${address}]` : address;
        return new URL(pathname, `http://${hostname}:${port}`);
    } else {
        throw new Error(`Invalid address: ${addressInfo}`);
    }
};

export const getBaseUrlForServer = (
    server: Server,
    pathname: string,
): URL => getBaseUrl(server.address(), pathname);
