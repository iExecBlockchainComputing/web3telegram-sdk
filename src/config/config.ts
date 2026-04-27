export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const ANY_DATASET_ADDRESS = 'any';

export const DEFAULT_CHAIN_ID = 421614;

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
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0x2956f0cb779904795a5f30d3b3ea88b714c3123f', // TDX workerpool
    dataProtectorSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    whitelistSmartContract: '0x7291ff96100DA6CF97933C225B86124ef95aEc9b',
  },
  42161: {
    name: 'arbitrum-mainnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0x8ef2ec3ef9535d4b4349bfec7d8b31a580e60244', // TDX workerpool
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
