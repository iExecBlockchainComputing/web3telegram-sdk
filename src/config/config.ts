export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const ANY_DATASET_ADDRESS = 'any';

export const CHAIN_IDS = {
  BELLECOUR: 134,
  AVALANCHE_FUJI: 43113,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export const DEFAULT_CHAIN_ID = CHAIN_IDS.BELLECOUR;

interface ChainConfig {
  name: string;
  dappAddress: string;
  prodWorkerpoolAddress: string;
  dataProtectorSubgraph: string;
  ipfsUploadUrl: string;
  ipfsGateway: string;
  whitelistSmartContract: string;
}

export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  [CHAIN_IDS.BELLECOUR]: {
    name: 'bellecour',
    dappAddress: 'web3telegram.apps.iexec.eth',
    prodWorkerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-bellecour.iex.ec/https',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    whitelistSmartContract: '0x192C6f5AccE52c81Fcc2670f10611a3665AAA98F',
  },
};

export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}
