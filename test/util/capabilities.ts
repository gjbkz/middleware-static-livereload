const projectName = 'middleware-static-livereload';
const buildName = `${projectName}#${process.env.CIRCLE_BUILD_NUM || new Date().toISOString()}`;
const userName = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;

interface IBrowsetStackOptions {
    os?: 'Windows' | 'OS X',
    osVersion?: string,
    deviceName?: string,
    realMobile?: 'true' | 'false',
    projectName?: string,
    buildName?: string,
    sessionName: string,
    local?: 'true' | 'false',
    localIdentifier: string,
    seleniumVersion?: string,
    userName?: string,
    accessKey?: string,
}

interface ICapability {
    browserName: string,
    browserVersion?: string,
}

interface IMergedCapability extends ICapability {
    'bstack:options': IBrowsetStackOptions,
}

const timeStamp = Date.now();
const name = 'ClientTest';
const capabilities: Array<IMergedCapability> = [];
if (userName && accessKey) {
    const list: Array<[ICapability, Partial<IBrowsetStackOptions>]> = [
        [{browserName: 'Chrome'}, {os: 'Windows', osVersion: '10'}],
        [{browserName: 'Firefox'}, {os: 'Windows', osVersion: '10'}],
        [{browserName: 'Edge'}, {os: 'Windows', osVersion: '10'}],
        [{browserName: 'IE'}, {os: 'Windows', osVersion: '10'}],
        [{browserName: 'Chrome'}, {os: 'OS X', osVersion: 'Catalina'}],
        [{browserName: 'Firefox'}, {os: 'OS X', osVersion: 'Catalina'}],
        [{browserName: 'Safari'}, {os: 'OS X', osVersion: 'Catalina'}],
        [{browserName: 'Safari'}, {osVersion: '14', deviceName: 'iPhone 8', realMobile: 'true'}],
        [{browserName: 'Safari'}, {osVersion: '13', deviceName: 'iPhone 8', realMobile: 'true'}],
        [{browserName: 'Chrome'}, {osVersion: '10.0', deviceName: 'Google Pixel 3', realMobile: 'true'}],
        [{browserName: 'Chrome'}, {osVersion: '9.0', deviceName: 'Google Pixel 3', realMobile: 'true'}],
    ];
    capabilities.push(...list.map(([capability, options], index) => {
        const merged: IBrowsetStackOptions = {
            ...options,
            projectName,
            buildName,
            sessionName: name,
            local: 'true',
            localIdentifier: `${name}-${timeStamp}-${index}`,
            userName,
            accessKey,
        };
        return {...capability, 'bstack:options': merged};
    }));
} else {
    capabilities.push({
        'browserName': 'chrome',
        'bstack:options': {
            sessionName: name,
            localIdentifier: `${name}-${timeStamp}-0`,
        },
    });
}
export {capabilities};
