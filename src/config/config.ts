export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const ANY_DATASET_ADDRESS = 'any';

export const DEFAULT_CHAIN_ID = 134;

interface ChainConfig {
  name: string;
  dappAddress?: string;
  prodWorkerpoolAddress: string;
  dataProtectorSubgraph: string;
  ipfsUploadUrl: string;
  ipfsGateway: string;
  whitelistSmartContract: string;
  isExperimental?: boolean;
}

export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  134: {
    name: 'bellecour',
    dappAddress: 'web3telegram.apps.iexec.eth',
    prodWorkerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-bellecour.iex.ec/https',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    whitelistSmartContract: '0x192C6f5AccE52c81Fcc2670f10611a3665AAA98F',
  },
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
    dataProtectorSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    whitelistSmartContract: '0x7291ff96100DA6CF97933C225B86124ef95aEc9b',
    isExperimental: true,
  },
  42161: {
    name: 'arbitrum-mainnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0x2C06263943180Cc024dAFfeEe15612DB6e5fD248',
    dataProtectorSubgraph:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/Ep5zs5zVr4tDiVuQJepUu51e5eWYJpka624X4DMBxe3u',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    whitelistSmartContract: '0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89',
  },
};

export const getChainDefaultConfig = (
  chainId: number,
  options?: { allowExperimentalNetworks?: boolean }
): ChainConfig | null => {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    return null;
  }
  if (config.isExperimental && !options?.allowExperimentalNetworks) {
    return null;
  }
  return config;
};
