# Changelog

## v1.3.0 (2024-09-01)

### Bug Fixes

- support filenames with CJK characters (#611) ([7231387](https://github.com/gjbkz/middleware-static-livereload/commit/723138700eef31d6bb92619afe6ae4c4377ecb1a))
- recursive copy ([d640f5f](https://github.com/gjbkz/middleware-static-livereload/commit/d640f5f4455016961a554aabcdba5a08d730226e))
- generateIndexHTML ([f7b1880](https://github.com/gjbkz/middleware-static-livereload/commit/f7b188061e84ac87dfd97b3866c5ff23b50229a7))
- fileURL handling ([4dfcb17](https://github.com/gjbkz/middleware-static-livereload/commit/4dfcb17810a4f57c849cec1aad01b69101a55e37))

### Tests

- types in .cjs and .mjs ([2b350d1](https://github.com/gjbkz/middleware-static-livereload/commit/2b350d1e4e4629252d18c9eeccd0ebeece707875))

### Code Refactoring

- fix eslint errors ([8aec8c4](https://github.com/gjbkz/middleware-static-livereload/commit/8aec8c463da4f2c58b172f9c45727dd0f653c033))
- use native https module ([f37d308](https://github.com/gjbkz/middleware-static-livereload/commit/f37d3082de2b12bc103708cdd03afc4863086ca9))
- use URL ([be6f720](https://github.com/gjbkz/middleware-static-livereload/commit/be6f7209f5e5bd86c50b34e49532f94523a658e9))
- delete src/normalizeURLPathname.ts ([4d0a50f](https://github.com/gjbkz/middleware-static-livereload/commit/4d0a50f9d8c55befbacd6352ffc26e99ed698d87))
- use fs.PathLike ([a2e43a9](https://github.com/gjbkz/middleware-static-livereload/commit/a2e43a9588dbdd9a9a7c5c5cbf58cc016fa4a30a))
- fix eslint errors ([8847bd2](https://github.com/gjbkz/middleware-static-livereload/commit/8847bd22a925f4690e3a9e9f5c0f1fd29b31980a))

### Continuous Integration

- use iPhone 13 ([b60cbd7](https://github.com/gjbkz/middleware-static-livereload/commit/b60cbd71ecfef23730ffe7e0fb73599f766bd691))
- remove v12 ([c245df9](https://github.com/gjbkz/middleware-static-livereload/commit/c245df9466b82b761d8d5c782a5baec69a31b468))

### Dependency Upgrades

- reinstall packages ([776cc83](https://github.com/gjbkz/middleware-static-livereload/commit/776cc83b0fe92e2a59426592422512f72fb65fb1))
- @nlib/eslint-config:3.19.5→3.19.6 @typescript-eslint/eslint-plugin:5.46.0→5.48.0 @typescript-eslint/parser:5.46.0→5.48.0 eslint:8.29.0→8.31.0 ([f4603cb](https://github.com/gjbkz/middleware-static-livereload/commit/f4603cb80a54a5db6cc314eced32bfcc683f2abc))
- @types/node:18.11.12→18.11.18 @types/selenium-webdriver:4.1.9→4.1.10 ([a17df7f](https://github.com/gjbkz/middleware-static-livereload/commit/a17df7f100fdf9c186b6260ab76e269f6043d7e5))
- selenium-webdriver:4.7.0→4.7.1 ([5ed4e45](https://github.com/gjbkz/middleware-static-livereload/commit/5ed4e455d840241cedd278f768b5e8aae225a00b))
- ava:4.3.3→5.1.0 ([f77c728](https://github.com/gjbkz/middleware-static-livereload/commit/f77c72877d6a6912fee785726706622fd3862708))
- install @nlib/changelog ([8eff098](https://github.com/gjbkz/middleware-static-livereload/commit/8eff09871edb259cc88c52941d0c9a0a7be50a03))
- npm update ([9c7d733](https://github.com/gjbkz/middleware-static-livereload/commit/9c7d733d6a835fd186b5868ac65dc8c502dad7d2))
- @nlib/esmify:0.1.2→0.3.0 ([fa0321c](https://github.com/gjbkz/middleware-static-livereload/commit/fa0321c58449a2e1b88bb16107c2f72ec12ce648))
- @types/node:17.0.45→18.7.8 ([9644771](https://github.com/gjbkz/middleware-static-livereload/commit/9644771016c856378c888aab1dab2430da5747bc))
- @nlib/eslint-config:3.18.0→3.19.4 @typescript-eslint/eslint-plugin:5.30.7→5.33.1 @typescript-eslint/parser:5.30.7→5.33.1 eslint:8.20.0→8.22.0 ([8376397](https://github.com/gjbkz/middleware-static-livereload/commit/8376397d31fa1490334399d9f2d08f15ff6e9dfa))
- node-fetch:3.2.9→3.2.10 ([cbac9d0](https://github.com/gjbkz/middleware-static-livereload/commit/cbac9d0a1568bce58204cb0e7f0b399c405079b0))
- selenium-webdriver:4.3.1→4.4.0 ([ec81b91](https://github.com/gjbkz/middleware-static-livereload/commit/ec81b91507695681b526b060f718b1ad208f57f8))
- @nlib/eslint-config:3.18.0→3.19.4 ([bfe067e](https://github.com/gjbkz/middleware-static-livereload/commit/bfe067e15267af2f39eeb8837ef4793b302c3a0a))
- @types/node:17.0.36→17.0.42 @typescript-eslint/eslint-plugin:5.26.0→5.27.1 @typescript-eslint/parser:5.26.0→5.27.1 eslint:8.16.0→8.17.0 lint-staged:12.4.2→13.0.1 node-fetch:3.2.5→3.2.6 typescript:4.7.2→4.7.3 ([0e8ade4](https://github.com/gjbkz/middleware-static-livereload/commit/0e8ade4d7d62c4f1394f9c38f7f29d9be710dec1))
- node-fetch:2.6.7→3.2.4 ([69012b7](https://github.com/gjbkz/middleware-static-livereload/commit/69012b73d77858e040a34c6ceefc887f7976c0af))
- @nlib/eslint-config:3.17.30→3.18.0 @types/node:17.0.31→17.0.35 @types/selenium-webdriver:4.0.19→4.1.0 @typescript-eslint/eslint-plugin:5.22.0→5.25.0 @typescript-eslint/parser:5.22.0→5.25.0 browserstack-local:1.5.0→1.5.1 eslint:8.14.0→8.15.0 node-fetch:2.6.7→3.2.4 ([f31ab88](https://github.com/gjbkz/middleware-static-livereload/commit/f31ab88e34dc26370041efec5783fc42bba9140d))
- @nlib/eslint-config:3.17.29→3.17.30 @types/node:16.11.27→17.0.31 @types/selenium-webdriver:4.0.18→4.0.19 @typescript-eslint/eslint-plugin:4.33.0→5.22.0 @typescript-eslint/parser:4.33.0→5.22.0 ava:3.15.0→4.2.0 browserstack-local:1.4.9→1.5.0 eslint:7.32.0→8.14.0 lint-staged:11.2.6→12.4.1 selenium-webdriver:4.1.1→4.1.2 ts-node:10.5.0→10.7.0 typescript:4.6.3→4.6.4 ([d1743d9](https://github.com/gjbkz/middleware-static-livereload/commit/d1743d93c451e5f6a4f6afdc91ffd5e66ba45056))


## v1.2.21 (2021-09-08)

### Features

- add charset=UTF-8 ([9625202](https://github.com/gjbkz/middleware-static-livereload/commit/962520209b93a6a71a33c0ed3a1cc539f90dd602))

### Continuous Integration

- change conditions ([4d14aa6](https://github.com/gjbkz/middleware-static-livereload/commit/4d14aa679f26e2380594e30793ceec2ef7cc5dca))
- omit name ([6f9e6dc](https://github.com/gjbkz/middleware-static-livereload/commit/6f9e6dc5d9728c253f98ab9c126c9996383503ef))

### Dependency Upgrades

- @nlib/eslint-config:3.17.24→3.17.25 @nlib/githooks:0.0.5→0.1.0 @types/node:16.7.10→16.7.13 @typescript-eslint/eslint-plugin:4.30.0→4.31.0 @typescript-eslint/parser:4.30.0→4.31.0 ([e91534f](https://github.com/gjbkz/middleware-static-livereload/commit/e91534f205f6174151438ab9d247e03869f6e271))
- remove some packages ([daf533c](https://github.com/gjbkz/middleware-static-livereload/commit/daf533c12da172434bfcae54c7615bbad72dc500))


## v1.2.20 (2021-09-04)

### Styles

- shorten ([ba319d9](https://github.com/gjbkz/middleware-static-livereload/commit/ba319d970dff614e7a31117b37b8abee98e7a080))

### Documentation

- update a badge ([a822190](https://github.com/gjbkz/middleware-static-livereload/commit/a82219033cb3aca6ee8ec76057eb629e961e9947))

### Continuous Integration

- use codecov-action@v2 ([1776ccc](https://github.com/gjbkz/middleware-static-livereload/commit/1776cccf5c283a6ec003c0e519ed8c69bcdb6add))
- refactoring workflow ([d00ab81](https://github.com/gjbkz/middleware-static-livereload/commit/d00ab810eb52e8fe229a13caf644fd80f28bec19))
- remove --offline ([cb1cdd7](https://github.com/gjbkz/middleware-static-livereload/commit/cb1cdd7af2a457ef5cc9654eecd087180db19a53))
- set environments ([346312e](https://github.com/gjbkz/middleware-static-livereload/commit/346312e32f4cb0d263a6d7c8167b00809e3e8a4b))

### Dependency Upgrades

- @nlib/changelog:0.1.9→0.1.10 ([fe9426b](https://github.com/gjbkz/middleware-static-livereload/commit/fe9426b853a793a8fd14773847d232c51ceb605e))
- @nlib/eslint-config:3.17.21→3.17.22 lint-staged:10.5.4→11.0.0 (#215) ([23baa68](https://github.com/gjbkz/middleware-static-livereload/commit/23baa68eaf8bcbfc716f437f6d9268462e1b23df))
- dedupe ([b38c123](https://github.com/gjbkz/middleware-static-livereload/commit/b38c12397400e8dd1031c74dfbba8aca6e350c81))


## v1.2.19 (2021-05-01)


## v1.2.18 (2021-04-06)

### Dependency Upgrades

- remove event-source-polyfill (#197) ([71c68d2](https://github.com/gjbkz/middleware-static-livereload/commit/71c68d2c36d7b1885effa1161ec8182807859730))
- upgrade dependencies (#193) ([4224072](https://github.com/gjbkz/middleware-static-livereload/commit/422407208541c90ce0df1949f5fa2a66c9309980))


## v1.2.17 (2020-12-20)

### Code Refactoring

- fs (#154) ([bd95b7b](https://github.com/gjbkz/middleware-static-livereload/commit/bd95b7b73370cb4621760b60f3f9155a3b6a3762))

### Dependency Upgrades

- upgrade dependencies (#138) ([8ea8405](https://github.com/gjbkz/middleware-static-livereload/commit/8ea840577f47dfbcf4603f3020bdc332dabd82eb))


## v1.2.16 (2020-11-10)

### Tests

- set timeout ([d5c7ca4](https://github.com/gjbkz/middleware-static-livereload/commit/d5c7ca49fc45bcfe3c50109274e69833402202da))


## v1.2.15 (2020-11-10)

### Tests

- use fetch ([67f97a1](https://github.com/gjbkz/middleware-static-livereload/commit/67f97a1211544c90757c0fdde8b942e6dc37d96b))
- fix middleware tests ([5cef326](https://github.com/gjbkz/middleware-static-livereload/commit/5cef3260751bab20ba6827b237587a464fcf0a7f))

### Code Refactoring

- remove readStream ([fb21143](https://github.com/gjbkz/middleware-static-livereload/commit/fb211433e2c0381149371327a63d3305aafc69f9))
- fix eslint errors ([f5cf638](https://github.com/gjbkz/middleware-static-livereload/commit/f5cf6388dece7edf5b7a369ee47822b284a72b6b))
- fix eslint errors ([3a5adb4](https://github.com/gjbkz/middleware-static-livereload/commit/3a5adb49f5be0b472bcb59b241a8d4b8d4f79ec9))

### Documentation

- update the BrowserStack badge ([4d333a3](https://github.com/gjbkz/middleware-static-livereload/commit/4d333a30077b13831ea5bb9fd41212b4b77e6c94))
- update badges ([8b2e203](https://github.com/gjbkz/middleware-static-livereload/commit/8b2e2032b4766529c642d205c9fa6a07d1ca8c05))

### Continuous Integration

- update configurations ([7305207](https://github.com/gjbkz/middleware-static-livereload/commit/730520736f70240e37f50879aecbb14393a5b3fe))
- setup github actions ([ce1ad5d](https://github.com/gjbkz/middleware-static-livereload/commit/ce1ad5d42a59c50f9b51f9d493adcf845cffbe16))

### Dependency Upgrades

- pin dependencies ([e6c0326](https://github.com/gjbkz/middleware-static-livereload/commit/e6c0326c7e57d5a520af5c1bcab359a374cd1950))
- setup some nlib tools ([f3178b6](https://github.com/gjbkz/middleware-static-livereload/commit/f3178b652674b348ef903d6c779e78c21eb873d6))


## v1.2.14 (2020-06-22)

### Tests

- remove spawn() ([b55fdd6](https://github.com/gjbkz/middleware-static-livereload/commit/b55fdd6eef13df692f1df77dbeee588c5e9e80c8))
- kill processes ([8abc39d](https://github.com/gjbkz/middleware-static-livereload/commit/8abc39d637733d0c41de04e283909bab6894dc5a))
- fix types ([c199cb6](https://github.com/gjbkz/middleware-static-livereload/commit/c199cb6045a023bbaaac968aa945c1304c2e3fac))
- fix reporter ([376f0e3](https://github.com/gjbkz/middleware-static-livereload/commit/376f0e3b938d2b14d2d29778c6b61283af54c58a))
- fix test scripts ([2c168ab](https://github.com/gjbkz/middleware-static-livereload/commit/2c168abd74c7fe0909ff8ef76b997cc18c814eb9))

### Code Refactoring

- fix eslint errors ([89902c2](https://github.com/gjbkz/middleware-static-livereload/commit/89902c261a33efa7295a1ca466b287639bfb1662))
- fix eslint errors ([3988a24](https://github.com/gjbkz/middleware-static-livereload/commit/3988a240ae178ae0535e7bdba4e5f0a7541e4a3c))


## v1.2.13 (2019-12-09)

### Features

- set stabilityThreshold ([0c1e40d](https://github.com/gjbkz/middleware-static-livereload/commit/0c1e40d365bd75b68f8e3e629d6ac78e7b68b2ed))


## v1.2.12 (2019-12-09)

### Code Refactoring

- fix an eslint error ([26ec3ac](https://github.com/gjbkz/middleware-static-livereload/commit/26ec3ac9951fe2fe423f5ded90fe1ada52a09b64))


## v1.2.11 (2019-12-09)


## v1.2.10 (2019-12-08)

### Tests

- add capabilities ([f85ca0a](https://github.com/gjbkz/middleware-static-livereload/commit/f85ca0a0a45f14c1a8ab39d388498426ec951ecd))

### Code Refactoring

- fix eslint and type errors ([8db59d4](https://github.com/gjbkz/middleware-static-livereload/commit/8db59d430d97c41f95fbffe3923a4969404e3812))


## v1.2.9 (2019-11-14)

### Code Refactoring

- fix eslint errors ([66b3fb6](https://github.com/gjbkz/middleware-static-livereload/commit/66b3fb6e25c59d428c48136a08db84d9bddf3fd1))


## v1.2.8 (2019-10-21)


## v1.2.7 (2019-09-06)


## v1.2.6 (2019-08-22)

### Tests

- update the last test ([fd2c4fc](https://github.com/gjbkz/middleware-static-livereload/commit/fd2c4fc6126fe1292cc066019d067b8ca5ac30ce))

### Code Refactoring

- fix the logic error ([f0d0764](https://github.com/gjbkz/middleware-static-livereload/commit/f0d0764d4ef67d92984b2745ff3e444f7412433b))
- fix eslint errors ([ff9a34d](https://github.com/gjbkz/middleware-static-livereload/commit/ff9a34da75b951446553de30b63a97ec096d8be8))


## v1.2.5 (2019-07-29)

### Bug Fixes

- upgrade dependencies ([c271d06](https://github.com/gjbkz/middleware-static-livereload/commit/c271d066910a1cee06fb5b9918cbf881ceb8e25c))


## v1.2.4 (2019-06-28)

### Tests

- add some tests for fs utils ([cadb0ef](https://github.com/gjbkz/middleware-static-livereload/commit/cadb0efa04e374fb8a463ced10eb697d2abf6092))
- add a test for listen ([4041773](https://github.com/gjbkz/middleware-static-livereload/commit/4041773fcd862062e2893c3ad99aba7de55f774e))
- add tests for handleError ([f1f7658](https://github.com/gjbkz/middleware-static-livereload/commit/f1f7658a59658f00c11e612cc44674565c0769f9))
- add a test for console ([b64ddd5](https://github.com/gjbkz/middleware-static-livereload/commit/b64ddd5ba5febdc810666617a2f018a7766a8888))

### Code Refactoring

- remove the end method from console ([759e1d5](https://github.com/gjbkz/middleware-static-livereload/commit/759e1d5ed743c07cd4c75c19b810f2d3ae451b10))


## v1.2.3 (2019-06-27)

### Tests

- createInserter ([8942b54](https://github.com/gjbkz/middleware-static-livereload/commit/8942b545049eb91656cfece8b13c9f31d26fe933))
- createSnippetInjector ([1e5de76](https://github.com/gjbkz/middleware-static-livereload/commit/1e5de76d0a29301387fbc528ae920a59ddf3adb4))
- createFileWatcher ([940117b](https://github.com/gjbkz/middleware-static-livereload/commit/940117bbd1de58a638148fa241a6f1f1694e32b6))
- createConsole ([ffa2d6c](https://github.com/gjbkz/middleware-static-livereload/commit/ffa2d6cb048f8cb6f5f3b9caf83e0f98750397d8))

### Code Refactoring

- object merging ([fba9080](https://github.com/gjbkz/middleware-static-livereload/commit/fba9080795d72a0cb4791200173e11f28ced3f04))

### Documentation

- update the options section ([b0aaa58](https://github.com/gjbkz/middleware-static-livereload/commit/b0aaa5874dd95de02ae5e6067259bb7142dad42b))


## v1.2.2 (2019-06-11)

### Bug Fixes

- license ([25dd6ff](https://github.com/gjbkz/middleware-static-livereload/commit/25dd6ff3aa2d49addbc3ccbd9994f82c56836f6e))


## v1.2.1 (2019-06-11)

### Bug Fixes

- event-source-polyfill ([0c2399e](https://github.com/gjbkz/middleware-static-livereload/commit/0c2399e0008840ddbb2db2725e7afc4d8d818722))


## v1.2.0 (2019-06-11)

### Features

- remove default export (#16) ([a0e2713](https://github.com/gjbkz/middleware-static-livereload/commit/a0e27138e3d7154996753156e53ee23036396e60))


## v1.1.0 (2019-06-11)

### Features

- add index generator (#15) ([03276b3](https://github.com/gjbkz/middleware-static-livereload/commit/03276b312b9ea5e44aa5d953af1bb82767d3a49a))


## v1.0.0 (2019-06-11)

### Features

- server sent events (breaking) (#12) ([6f4f846](https://github.com/gjbkz/middleware-static-livereload/commit/6f4f84687599b55818e150964b7ba91c9fdac5fb))


## v0.0.5 (2018-04-12)


## v0.0.4 (2017-05-09)


