# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.6](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v1.0.0-alpha.5...dapp-v1.0.0-alpha.6) (2026-04-30)


### ⚠ BREAKING CHANGES

* bellecour chain support is removed; `ethProvider` is now required in `IExecWeb3telegram` constructor (used to fallback to a read-only provider connected to bellecour); `host` is now required as the second argument of `getWeb3Provider(privateKey, host, options)` (host used to be an option with a fallback to bellecour).

### Changed

* remove bellecour and SGX Scone support (https://github.com/iExecBlockchainComputing/web3telegram-sdk/pull/108) ([e740067](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/e7400677fbee3f6fda5b1c1fa767aaa58af80e14))

## [1.0.0-alpha.5](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v1.0.0-alpha.4...dapp-v1.0.0-alpha.5) (2026-04-20)


### Changed

* dapp dynamic ipfs gateway ([#103](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/103)) ([9848a29](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/9848a293c625edf7aa5bc659c684612177d1475a))

## [1.0.0-alpha.4](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v1.0.0-alpha.3...dapp-v1.0.0-alpha.4) (2025-11-17)


### Changed

* **dapp:** implement rate limiting to prevent 429 errors ([#90](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/90)) ([ae57ff1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ae57ff1a53d978ddc315392c409c50fc07fdc450))

## [1.0.0-alpha.3](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v0.1.0-alpha.3...dapp-v1.0.0-alpha.3) (2025-11-10)


### ⚠ BREAKING CHANGES

* **iapp:** result file renamed to `result.json`; single protectedData result file now contains `{"success": <boolean>, "protectedData"?: <address>, "error"?: <string> }`; upon error, the iapp will now exit 0 and output `"success": false` and `"error": <string>` rather than falling the task.

### Added

* **iapp:** support bulk processing ([#82](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/82)) ([15d0936](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/15d093636b3f065d76270c5f537661ba9d684527))

## [0.1.0-alpha.3](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v0.1.0-alpha.2...dapp-v0.1.0-alpha.3) (2025-09-05)


### Changed

* remove mprotect option and optimize memory configuration ([#73](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/73)) ([d479e16](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/d479e16286937732aa737eb082c1de25d02d38e5))

## [0.1.0-alpha.2](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v0.1.0-alpha.1...dapp-v0.1.0-alpha.2) (2025-08-08)


### Added

* implement Telegram API integration and fix TEE memory usage ([#71](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/71)) ([00a8e67](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/00a8e675d0d4146238e23315663cd49a7534a070))

## [0.1.0-alpha.1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/dapp-v0.1.0-alpha.0...dapp-v0.1.0-alpha.1) (2025-07-28)

### Changed

- add .js extensions to ES module imports ([#56](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/56)) ([0a63891](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/0a638918b08e7c2f9f62bf155609f267d39e3ba5))
- rollback debug logging changes from develop branch ([404ce33](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/404ce33e7d0705c274155813951284cd1830a3d2))

## [0.0.2-alpha] - 2025-03-10

### Changed

- Renamed `chatId` field to `telegram_chatId` in protected data parsing.

## [0.0.1-alpha] Initial release
