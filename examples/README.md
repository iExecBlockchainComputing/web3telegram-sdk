# Examples

basic `@iexec/web3telegram` examples using various environment and bundlers.

the example recovers the contacts (eth address) who have authorized the web3telegram dapp to send them messages.

## Usage

build the `@iexec/web3telegram` project from the repository root directory

```sh
cd .. && npm ci && npm run build && cd examples
```

pick a demo

```sh
# node typescript demo for example
cd node-ts
```

install deps

```sh
npm i
```

run the demo

```sh
npm start
```

**NB:** for browser examples

- you will need an ethereum wallet connected to [iexec sidechain](https://chainlist.org/chain/134)
- click the `TEST` button to start fetching contacts
