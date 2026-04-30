import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  Wallet,
  formatEther,
  toBeHex,
} from 'ethers';

/** Must match tests/test-utils.ts prodWorkerpoolOwnerWallet / appOwnerWallet private keys. */
const PROD_WORKERPOOL_OWNER_PK =
  '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc';
const APP_OWNER_PK =
  '0xa911b93e50f57c156da0b8bff2277d241bcdb9345221a3e246a99c6e7cedcde5';

const PROD_WORKERPOOL_OWNER_WALLET = new Wallet(
  PROD_WORKERPOOL_OWNER_PK
).address;
const APP_OWNER_WALLET = new Wallet(APP_OWNER_PK).address;
const TARGET_POCO_ADMIN_WALLET = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const PROD_WORKERPOOL = '0x2956f0cb779904795a5f30d3b3ea88b714c3123f';
const WEB3_TELEGRAM_DAPP_ADDRESS = '0x7f67e78a4b0A98c50333B8b72851952c396601a1';
const IEXEC_HUB_ADDRESS = '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E';

const rpcURL = 'http://localhost:8555';

const provider = new JsonRpcProvider(rpcURL, undefined, {
  pollingInterval: 1000,
});

const setBalance = async (address, weiAmount) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, toBeHex(weiAmount)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const balance = await provider.getBalance(address);
  console.log(`${address} wallet balance is now ${formatEther(balance)} ETH`);
};

const impersonate = async (address) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_impersonateAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`impersonating ${address}`);
};

const stopImpersonate = async (address) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_stopImpersonatingAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`stop impersonating ${address}`);
};

const getIExecHubOwnership = async (hubAddress, targetOwner) => {
  const iexecContract = new Contract(
    hubAddress,
    [
      {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'address', name: 'newOwner', type: 'address' },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    provider
  );
  const iexecOwner = await iexecContract.owner();
  await setBalance(iexecOwner, 1n * 10n ** 18n);
  await impersonate(iexecOwner);
  await iexecContract
    .connect(new JsonRpcSigner(provider, iexecOwner))
    .transferOwnership(targetOwner)
    .then((tx) => tx.wait());
  await stopImpersonate(iexecOwner);

  const newOwner = await iexecContract.owner();
  console.log(`IExecHub proxy at ${hubAddress} is now owned by ${newOwner}`);
};

const getIExecResourceOwnership = async (resourceAddress, targetOwner) => {
  const RESOURCE_ABI = [
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'registry',
      outputs: [
        {
          internalType: 'contract IRegistry',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const RESOURCE_REGISTRY_ABI = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  const resourceContract = new Contract(
    resourceAddress,
    RESOURCE_ABI,
    provider
  );

  const resourceOwner = await resourceContract.owner();
  const resourceRegistryAddress = await resourceContract.registry();
  const resourceRegistryContract = new Contract(
    resourceRegistryAddress,
    RESOURCE_REGISTRY_ABI,
    provider
  );

  await impersonate(resourceOwner);
  await resourceRegistryContract
    .connect(new JsonRpcSigner(provider, resourceOwner))
    .safeTransferFrom(resourceOwner, targetOwner, resourceAddress)
    .then((tx) => tx.wait());
  await stopImpersonate(resourceOwner);

  const newOwner = await resourceContract.owner();
  console.log(`resource ${resourceAddress} is now owned by ${newOwner}`);
};

const main = async () => {
  console.log(`preparing arbitrum-sepolia-fork at ${rpcURL}`);

  await setBalance(TARGET_POCO_ADMIN_WALLET, 1000000n * 10n ** 18n);
  await getIExecHubOwnership(IEXEC_HUB_ADDRESS, TARGET_POCO_ADMIN_WALLET);

  await getIExecResourceOwnership(
    PROD_WORKERPOOL,
    PROD_WORKERPOOL_OWNER_WALLET
  );
  await getIExecResourceOwnership(WEB3_TELEGRAM_DAPP_ADDRESS, APP_OWNER_WALLET);

  await setBalance(PROD_WORKERPOOL_OWNER_WALLET, 100n * 10n ** 18n);
  await setBalance(APP_OWNER_WALLET, 100n * 10n ** 18n);
};

main();
