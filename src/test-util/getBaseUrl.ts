import {URL} from 'url';
import type {AddressInfo, Server} from 'net';

const isIPv6 = (family: number | string) => family === 6 || family === 'IPv6';

export const getBaseUrl = (
    addressInfo: AddressInfo | string | null,
    pathname = '/',
): URL => {
    if (typeof addressInfo === 'object' && addressInfo) {
        const {address, family, port} = addressInfo;
        const hostname = isIPv6(family) ? `[${address}]` : address;
        return new URL(pathname, `http://${hostname}:${port}`);
    } else {
        throw new Error(`Invalid address: ${addressInfo}`);
    }
};

export const getBaseUrlForServer = (
    server: Server,
    pathname: string,
): URL => getBaseUrl(server.address(), pathname);
