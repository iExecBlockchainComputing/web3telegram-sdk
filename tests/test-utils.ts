import {
  Wallet,
  JsonRpcProvider,
  ethers,
  Contract,
  keccak256,
  AbiCoder,
  toBeHex,
} from 'ethers';
import {
  type Web3TelegramConfigOptions,
  type Web3SignerProvider,
} from '../src/web3telegram/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';

/** Production web3telegram TDX app on Arbitrum Sepolia (fork inherits deployment). */
export const TEST_WEB3TELEGRAM_DAPP_ADDRESS =
  '0x7f67e78a4b0A98c50333B8b72851952c396601a1';

export const TEST_CHAIN = {
  ipfsGateway: 'http://127.0.0.1:8080',
  ipfsNode: 'http://127.0.0.1:5001',
  rpcURL: 'http://localhost:8555',
  chainId: '421614',
  smsURL: 'http://127.0.0.1:13350',
  smsDebugURL: 'http://127.0.0.1:13351',
  resultProxyURL: 'http://127.0.0.1:13250',
  iexecGatewayURL: 'http://127.0.0.1:3050',
  compassURL: 'http://127.0.0.1:8069',
  prodWorkerpool: '0x2956f0cb779904795a5f30d3b3ea88b714c3123f',
  prodWorkerpoolOwnerWallet: new Wallet(
    '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
  ),
  appOwnerWallet: new Wallet(
    '0xa911b93e50f57c156da0b8bff2277d241bcdb9345221a3e246a99c6e7cedcde5'
  ),
  provider: new JsonRpcProvider('http://localhost:8555', 421614, {
    pollingInterval: 1000,
  }),
  hubAddress: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
  isNative: false,
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const MAX_EXPECTED_SUBGRAPH_INDEXING_TIME = 5_000;

const DATAPROTECTOR_SUBGRAPH_URL =
  'http://127.0.0.1:8000/subgraphs/name/DataProtector-v2';

export const waitSubgraphIndexing = async (
  timeoutMs = 60_000
): Promise<void> => {
  const provider = new JsonRpcProvider(TEST_CHAIN.rpcURL);
  const targetBlock = await provider.getBlockNumber();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(DATAPROTECTOR_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _meta { block { number } } }' }),
      });
      const json = await res.json();
      const indexedBlock: number = json?.data?._meta?.block?.number ?? 0;
      if (indexedBlock >= targetBlock) return;
    } catch {
      // subgraph not ready yet, keep polling
    }
    await sleep(1_000);
  }
  throw new Error(
    `waitSubgraphIndexing: subgraph did not index block ${targetBlock} within ${timeoutMs}ms`
  );
};

const anvilSetBalance = async (address: string, targetWeiBalance: bigint) => {
  await fetch(TEST_CHAIN.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, toBeHex(targetWeiBalance)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const setBalance = async (
  address: string,
  targetWeiBalance: ethers.BigNumberish
) => {
  await anvilSetBalance(address, BigInt(`${targetWeiBalance}`));
};

export const setEthForGas = async (
  address: string,
  wei: bigint = 10n ** 18n
) => {
  await setBalance(address, wei);
};

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

export const MARKET_API_CALL_TIMEOUT = 2_000;

export const getTestWeb3SignerProvider = (
  privateKey: string = Wallet.createRandom().privateKey
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(TEST_CHAIN.rpcURL, privateKey);

export const getTestRpcProvider = () => new JsonRpcProvider(TEST_CHAIN.rpcURL);

const anvilSetNRlcTokenBalance = async (
  address: string,
  targetNRlcBalance: ethers.BigNumberish
) => {
  const hubContract = new Contract(
    TEST_CHAIN.hubAddress,
    [
      {
        inputs: [],
        name: 'token',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    TEST_CHAIN.provider
  );
  const rlcAddress = await hubContract.token();

  const erc20StorageLocation =
    '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00';

  const balanceSlot = keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [address, erc20StorageLocation]
    )
  );

  await fetch(TEST_CHAIN.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setStorageAt',
      params: [
        rlcAddress,
        balanceSlot,
        toBeHex(BigInt(`${targetNRlcBalance}`), 32),
      ],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const setNRlcBalance = async (
  address: string,
  nRlcTargetBalance: ethers.BigNumberish
) => {
  if (TEST_CHAIN.isNative) {
    const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n;
    await anvilSetBalance(address, weiAmount);
    return;
  }
  await anvilSetNRlcTokenBalance(address, nRlcTargetBalance);
};

export const getTestIExecOption = () => ({
  smsURL: TEST_CHAIN.smsURL,
  smsDebugURL: TEST_CHAIN.smsDebugURL,
  resultProxyURL: TEST_CHAIN.resultProxyURL,
  iexecGatewayURL: TEST_CHAIN.iexecGatewayURL,
  ipfsGatewayURL: TEST_CHAIN.ipfsGateway,
  ipfsNodeURL: TEST_CHAIN.ipfsNode,
  compassURL: TEST_CHAIN.compassURL,
  hubAddress: TEST_CHAIN.hubAddress,
});

export const getTestConfig = (
  privateKey?: string
): [Web3SignerProvider, Web3TelegramConfigOptions] => {
  const ethProvider = privateKey
    ? getTestWeb3SignerProvider(privateKey)
    : undefined;
  const options = {
    dappAddress: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
    iexecOptions: getTestIExecOption(),
    ipfsGateway: 'http://127.0.0.1:8080',
    ipfsNode: 'http://127.0.0.1:5001',
    dataProtectorSubgraph:
      'http://127.0.0.1:8000/subgraphs/name/DataProtector-v2',
  };
  return [ethProvider, options];
};

export const getEventFromLogs = (eventName, logs, { strict = true }) => {
  const eventFound = logs.find((log) => log.eventName === eventName);
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return undefined;
  }
  return eventFound;
};

export const getId = () => randomInt(0, 1000000);

export const deployRandomDataset = async (iexec: IExec, owner?: string) =>
  iexec.dataset.deployDataset({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `dataset${getId()}`,
    multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    checksum:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

export const getRandomTxHash = () => {
  const characters = '0123456789abcdef';
  let hash = '0x';

  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hash += characters[randomIndex];
  }

  return hash;
};

export const createAndPublishAppOrders = async (
  resourceProvider,
  appAddressOrEns
) => {
  let appAddress = appAddressOrEns;
  if (appAddressOrEns && appAddressOrEns.includes('.eth')) {
    appAddress = await resourceProvider.ens.resolveName(appAddressOrEns);
    if (!appAddress) {
      throw new Error(`Failed to resolve ENS name: ${appAddressOrEns}`);
    }
  }

  await resourceProvider.order
    .createApporder({
      app: appAddress,
      tag: ['tee', 'tdx'],
      volume: 100,
      appprice: 0,
    })
    .then(resourceProvider.order.signApporder)
    .then(resourceProvider.order.publishApporder);
};

export const ensureSufficientStake = async (
  iexec: IExec,
  requiredStake: ethers.BigNumberish
) => {
  const walletAddress = await iexec.wallet.getAddress();
  const account = await iexec.account.checkBalance(walletAddress);

  if (BigInt(account.stake.toString()) < BigInt(requiredStake.toString())) {
    await setNRlcBalance(walletAddress, requiredStake);
    await iexec.account.deposit(requiredStake.toString());
  }
};

export const createAndPublishWorkerpoolOrder = async (
  workerpool: string,
  workerpoolOwnerWallet: ethers.Wallet,
  requesterrestrict?: string,
  workerpoolprice: number = 0,
  volume: number = 1000
) => {
  try {
    const ethProvider = utils.getSignerFromPrivateKey(
      TEST_CHAIN.rpcURL,
      workerpoolOwnerWallet.privateKey
    );
    const iexec = new IExec({ ethProvider }, getTestIExecOption());
    const requiredStake = volume * workerpoolprice;
    await ensureSufficientStake(iexec, requiredStake);

    const workerpoolorder = await iexec.order.createWorkerpoolorder({
      workerpool,
      category: 0,
      requesterrestrict,
      volume,
      workerpoolprice,
      tag: ['tee', 'tdx'],
    });
    await iexec.order
      .signWorkerpoolorder(workerpoolorder)
      .then((o) => iexec.order.publishWorkerpoolorder(o));
  } catch (error) {
    console.warn(
      `Skipping workerpool order creation for ${workerpool}: ${error.message}`
    );
  }
};
