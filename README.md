<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">Web3Telegram</h1>

**Web3Telegram** offers developers methods to create apps that:

- enable an entity (such as a (d)app provider or an end-user) to message an Ethereum account holder without knowing her/his chatId or telegram username.
- eliminate the need for end-users to share their chatId or  telegram username with multiple third-parties, reducing the risk of data breaches and spam.

Web3Telegram is composed of 2 methods:

- **fetchMyContacts** — that enables an entity to retrieve a list of Ethereum accounts whose owners have authorized the entity to message them
- **fetchUserContacts** — that enables an entity to retrieve a list of Ethereum accounts whose owners have authorized the provided user to message them
- **sendTelegram** — that allows an entity to message a user on telegram (previously fetched via the fetchMyContacts method) knowing only her/his Ethereum account.

<div align="center">

[![npm](https://img.shields.io/npm/v/@iexec/web3telegram)](https://www.npmjs.com/package/@iexec/web3telegram)[![license](https://img.shields.io/badge/license-Apache%202-blue)](/LICENSE)

</div>

## Installation

Web3Telegram will be available as an [npm package](https://www.npmjs.com/package/@iexec/web3telegram).

**npm:**

```sh
npm install @iexec/web3telegram
```

**yarn:**

```sh
yarn add @iexec/web3telegram
```

## Get started

### Browser

```ts
import { IExecWeb3telegram } from "@iexec/web3telegram";

const web3Provider = window.ethereum;
const web3telegram = new IExecWeb3telegram(web3Provider);
```

### NodeJS

```ts
import { IExecWeb3telegram, getWeb3Provider } from "@iexec/web3telegram";

const { PRIVATE_KEY } = process.env; 

const web3Provider = getWeb3Provider(PRIVATE_KEY);
const web3telegram = new IExecWeb3telegram(web3Provider);
```

## Documentation

- [Web3telegram documentation](https://tools.docs.iex.ec/tools/web3telegram)
- [Web3telegram technical design](./technical-design/index.md)
- [iExec Protocol documentation](https://protocol.docs.iex.ec)

## License

This project is licensed under the terms of the [Apache 2.0](/LICENSE).
