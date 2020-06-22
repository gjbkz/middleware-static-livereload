const {promises: afs} = require('fs');
const path = require('path');

/**
 * @param {string} src
 * @param {string} dest
 */
const copy = async (src, dest) => {
    await afs.mkdir(dest, {recursive: true});
    await Promise.all((await afs.readdir(src)).map(async (name) => {
        const srcFile = path.join(src, name);
        const destFile = path.join(dest, name);
        await afs.copyFile(srcFile, destFile);
        console.log(`Copied: ${srcFile} → ${destFile}`);
    }));
};

copy(...process.argv.slice(-2))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
