# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-alpha](https://github.com/iExecBlockchainComputing/web3telegram-sdk/compare/web3telegram-v0.0.3-alpha...web3telegram-v0.1.0-alpha) (2025-07-11)


### Added

* add dapp CI workflow for dapp folder changes ([9d02253](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/9d02253d3df2b899335e87b97c93da48b9a81f40))
* add deployment-dapp CI workflow and remove dapp-deployment-default from drone.yml ([cad1c39](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/cad1c3960524d9e1db87de0ef3254cb88fe152e9))
* add GitHub Actions workflow for npm package publishing ([c4e2bf5](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/c4e2bf571d9301040a7599843e5e7d71cb3199bc))
* add GitHub Actions workflow for web3telegram dapp deployment ([f9dd6c6](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/f9dd6c6d20cac67f15f55f4cd4ec689ce2612d1e))
* add release-please workflow for automated releases ([18782b4](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/18782b44d70cde0616c81ddd6ea05e87624f39b5))
* add sconified image tag generation and pass to deployment scripts ([345d85d](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/345d85d5d71a9c856ca4b713024d024c22c5ccb3))
* add test change to trigger release-please version bump ([e0ddcea](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/e0ddceab63360eed7394c49a98d942a634fc379a))
* **config:** add CHAIN_CONFIG for multichain support ([206292b](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/206292b17d0c0e20eff18a11ad1abaf6e3e3b48d))
* **utils:** add getChainIdFromProvider util ([ab33c42](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ab33c4259be46c3af4c4adc79d59e2cd3cd6d131))


### Changed

* convert BigNumberish to string for NRLCAmount compatibility ([989afda](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/989afda36c838c836ecf9a4ccc6afd96b28da340))
* **dapp version:** correct version to 0.0.2 ([acff8f1](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/acff8f1b37d2faef7c52a6ee9027dc0014030a38))
* **dapp version:** correct version to 0.0.2 ([30593cb](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/30593cb943f11f864a58bea03ec181b9fa2ad4b2))
* export TEST_CHAIN from test-utils for test compatibility ([ab4d9f8](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ab4d9f8b9264ca03280ce248d353946ed6f215cf))
* **ipfs:** remove default node/gateway, use SDK config ([af97aab](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/af97aab4f212e86380114e596d5852a71527c361))
* migrate from develop branch to trunk-based development ([abe4896](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/abe4896715eb5b14aa0aa462031980c95a94e8cb))
* migrate from develop branch to trunk-based development ([ccaafab](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/ccaafab2d8c4266293ab9635e75a01ac5e502cef))
* remove invalid versioning field from release-please config ([c0758dc](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/c0758dc65481ed77fd672bd9a22519bd411d93b8))
* remove invalid versioning field from release-please config ([c164075](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/c164075e42b678b44137ec006ab1039fa182b9f3))
* remove sdk-default and dapp-default pipelines from drone.yml ([24b08f5](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/24b08f5451aca3d09d037fe709cefadee169629a))
* restore prerelease config and remove manifest file ([3075fd0](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/3075fd0888c29fe8e04af97fdd18bd05be0e2b1b))
* rollback debug logging changes from develop branch ([404ce33](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/404ce33e7d0705c274155813951284cd1830a3d2))
* **sdk:** IExecWeb3telegram uses async config and chain detection ([4cc2b8e](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/4cc2b8e10877f5602bf12f9792caa754729c6373))
* **types:** update Web3TelegramConfigOptions for multichain ([67cae09](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/67cae0990fb7c09447cbd4f4ed68ce58e9e04409))
* update error message for encryption failure ([f4cb2a7](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/f4cb2a7001399e81bfa2d77b1b1670273920a9dc))
* update release-please config to handle alpha versions properly ([80c57dd](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/80c57dd861ef6c236351c162f20dfc8562d69edb))
* update test:e2e script to run only e2e tests and fix test-utils configuration ([8b6734c](https://github.com/iExecBlockchainComputing/web3telegram-sdk/commit/8b6734c19af5eb2f67a58bc4ee3e4378d93a3cfc))

## [0.0.3-alpha] - 2025-04-04

### Changed

- Migrated the iApp codebase to ES Modules (ESM).
- Migrated Bellecour subgraph URL to `https://thegraph.iex.ec`.

## [0.0.2-alpha] - 2025-03-11

### Changed

- Renamed `chatId` field to `telegram_chatId` in protected data.

## [0.0.1-alpha] Initial release
