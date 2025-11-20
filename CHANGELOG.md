# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-alpha.8](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.7...web3telegram-v0.1.0-alpha.8) (2025-11-20)


### Changed

* enable campaigns on arbitrum-mainnet ([#92](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/92)) ([43c9067](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/43c906778805e3795e12be44393d81a787fed03f))

## [0.1.0-alpha.7](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.6...web3telegram-v0.1.0-alpha.7) (2025-11-13)


### Changed

* add dealId to sendTelegram response to allow tracking uninitialized tasks by dealId ([#87](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/87)) ([46c1a19](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/46c1a19e6b22e26705cab625f17e3d82946c08ce))
* improve campaign methods interfaces ([#89](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/89)) ([c62d51d](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/c62d51d53aaeacb5edb79d59e97aa1aa54f429ea))

## [0.1.0-alpha.6](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.5...web3telegram-v0.1.0-alpha.6) (2025-11-10)


### Added

* add bulk Telegram campaigns ([#83](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/83)) ([1eabf93](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/1eabf93d18dbfb175cf660b377bd39f22881609f))

## [0.1.0-alpha.5](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.4...web3telegram-v0.1.0-alpha.5) (2025-10-14)


### Added

* Migrate `arbitrum-sepolia-testnet` from experimental to non-experimental network ([#78](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/78)) ([1d2ee65](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/1d2ee657760dce6d84daf3292924901f2b93a7db))


### Changed

* update dependencies and remove experimental flag from config ([1d2ee65](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/1d2ee657760dce6d84daf3292924901f2b93a7db))

## [0.1.0-alpha.4](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.3...web3telegram-v0.1.0-alpha.4) (2025-08-07)


### Added

* add support arbitrum mainnet ([7cf7580](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/7cf7580810b8a70079bec34a014507f279ea7f97))

## [0.1.0-alpha.3](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.2...web3telegram-v0.1.0-alpha.3) (2025-07-31)


### Added

* add name, accessPrice and remainingAccess properties to Contact ([#66](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/66)) ([a89bc58](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/a89bc584e28d164282776af25b82061fbf7e54b9))


### Changed

* stop exporting internal types ([a89bc58](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/a89bc584e28d164282776af25b82061fbf7e54b9))

## [0.1.0-alpha.2](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.1...web3telegram-v0.1.0-alpha.2) (2025-07-30)


### Added

* add multi-chain configuration and experimental networks support ([#46](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/46)) ([26715d1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/26715d164bd574d41d01ba5b31853ee10ca6b37e))
* dapp address resolution from compass ([#53](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/53)) ([9895a48](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/9895a482006e4f97d8195605559f8af17d89092c))


### Changed

* add .js extensions to ES module imports ([#56](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/56)) ([0a63891](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/0a638918b08e7c2f9f62bf155609f267d39e3ba5))
* move to latest arbitrum-sepolia-testnet deployment ([#61](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/61)) ([d83605e](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/d83605e369e75aff91690d2958b1345147cb367e))
* prevent fetchUserContacts error when user has no contact ([#64](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/64)) ([261dcb1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/261dcb1cec05641555966df85f58cceb78f3ad15))

## [0.1.0-alpha.1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.1.0-alpha.0...web3telegram-v0.1.0-alpha.1) (2025-07-23)


### Added

* add deployment-dapp CI workflow and remove dapp-deployment-default from drone.yml ([cad1c39](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/cad1c3960524d9e1db87de0ef3254cb88fe152e9))
* add release-please workflow for automated releases ([18782b4](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/18782b44d70cde0616c81ddd6ea05e87624f39b5))
* **config:** add CHAIN_CONFIG for multichain support ([206292b](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/206292b17d0c0e20eff18a11ad1abaf6e3e3b48d))
* migrate to GitHub Actions and enhance deployment workflow  ([7bab3dc](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/7bab3dcb63198d688437806393a30ae70f40ccaf))
* **utils:** add getChainIdFromProvider util ([ab33c42](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ab33c4259be46c3af4c4adc79d59e2cd3cd6d131))


### Changed

* correct release-please manifest format to resolve version parsing error ([3ee5244](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/3ee5244c4f63c16e02eec0451b805e56f3491cd7))
* **dapp version:** correct version to 0.0.2 ([acff8f1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/acff8f1b37d2faef7c52a6ee9027dc0014030a38))
* **ipfs:** remove default node/gateway, use SDK config ([af97aab](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/af97aab4f212e86380114e596d5852a71527c361))
* migrate from develop branch to trunk-based development ([abe4896](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/abe4896715eb5b14aa0aa462031980c95a94e8cb))
* migrate from develop branch to trunk-based development ([ccaafab](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ccaafab2d8c4266293ab9635e75a01ac5e502cef))
* remove sdk-default and dapp-default pipelines from drone.yml ([24b08f5](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/24b08f5451aca3d09d037fe709cefadee169629a))
* rollback debug logging changes from develop branch ([404ce33](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/404ce33e7d0705c274155813951284cd1830a3d2))
* **sdk:** IExecWeb3telegram uses async config and chain detection ([4cc2b8e](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/4cc2b8e10877f5602bf12f9792caa754729c6373))
* simplify release-please config to single package and remove invalid versioning field ([e4c7e36](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/e4c7e36fd91d92c8d6497420945ffaca3db7fa87))
* **types:** update Web3TelegramConfigOptions for multichain ([67cae09](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/67cae0990fb7c09447cbd4f4ed68ce58e9e04409))
* update error message for encryption failure ([f4cb2a7](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/f4cb2a7001399e81bfa2d77b1b1670273920a9dc))
* update kubo-rpc-client to version 4.1.3 ([#45](https://github.com/iExecBlockchainComputing/web3telegram-sdk/issues/45)) ([5d63f6e](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/5d63f6ed9584628208ed7bb3fd8686bf337b3604))
* update test:e2e script to run only e2e tests and fix test-utils configuration ([8b6734c](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/8b6734c19af5eb2f67a58bc4ee3e4378d93a3cfc))

## [0.0.3-alpha] - 2025-04-04

### Changed

- Migrated the iApp codebase to ES Modules (ESM).
- Migrated Bellecour subgraph URL to `https://thegraph.iex.ec`.

## [0.0.2-alpha] - 2025-03-11

### Changed

- Renamed `chatId` field to `telegram_chatId` in protected data.

## [0.0.1-alpha] Initial release
