import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendTelegram } from './sendTelegram.js';
import {
  Contact,
  FetchUserContactsParams,
  SendTelegramParams,
  AddressOrENS,
  Web3TelegramConfigOptions,
  SendTelegramResponse,
  Web3SignerProvider,
  FetchMyContactsParams,
} from './types.js';
import { getChainDefaultConfig } from '../config/config.js';
import { isValidProvider } from '../utils/validators.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';

type EthersCompatibleProvider =
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider
  | Web3SignerProvider
  | string;

interface Web3telegramResolvedConfig {
  dappAddressOrENS: AddressOrENS;
  dappWhitelistAddress: AddressOrENS;
  graphQLClient: GraphQLClient;
  ipfsNode: string;
  ipfsGateway: string;
  defaultWorkerpool: string;
  iexec: IExec;
}

export class IExecWeb3telegram {
  private dappAddressOrENS!: AddressOrENS;

  private dappWhitelistAddress!: AddressOrENS;

  private graphQLClient!: GraphQLClient;

  private ipfsNode!: string;

  private ipfsGateway!: string;

  private defaultWorkerpool!: string;

  private iexec!: IExec;

  private initPromise: Promise<void> | null = null;

  private ethProvider: EthersCompatibleProvider;

  private options: Web3TelegramConfigOptions;

  constructor(
    ethProvider?: EthersCompatibleProvider,
    options?: Web3TelegramConfigOptions
  ) {
    this.ethProvider = ethProvider || 'bellecour';
    this.options = options || {};
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.resolveConfig().then((config) => {
        this.dappAddressOrENS = config.dappAddressOrENS;
        this.dappWhitelistAddress = config.dappWhitelistAddress;
        this.graphQLClient = config.graphQLClient;
        this.ipfsNode = config.ipfsNode;
        this.ipfsGateway = config.ipfsGateway;
        this.defaultWorkerpool = config.defaultWorkerpool;
        this.iexec = config.iexec;
      });
    }
    return this.initPromise;
  }

  async fetchMyContacts(args?: FetchMyContactsParams): Promise<Contact[]> {
    await this.init();
    await isValidProvider(this.iexec);

    return fetchMyContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async fetchUserContacts(args: FetchUserContactsParams): Promise<Contact[]> {
    await this.init();

    return fetchUserContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async sendTelegram(args: SendTelegramParams): Promise<SendTelegramResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return sendTelegram({
      ...args,
      workerpoolAddressOrEns:
        args.workerpoolAddressOrEns || this.defaultWorkerpool,
      iexec: this.iexec,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
      graphQLClient: this.graphQLClient,
    });
  }

  private async resolveConfig(): Promise<Web3telegramResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainDefaultConfig = getChainDefaultConfig(chainId, {
      allowExperimentalNetworks: this.options.allowExperimentalNetworks,
    });

    const subgraphUrl =
      this.options?.dataProtectorSubgraph ||
      chainDefaultConfig?.dataProtectorSubgraph;
    const dappAddressOrENS =
      this.options?.dappAddressOrENS || chainDefaultConfig?.dappAddress;
    const dappWhitelistAddress =
      this.options?.dappWhitelistAddress ||
      chainDefaultConfig?.whitelistSmartContract;
    const ipfsGateway =
      this.options?.ipfsGateway || chainDefaultConfig?.ipfsGateway;
    const defaultWorkerpool = chainDefaultConfig?.prodWorkerpoolAddress;
    const ipfsNode =
      this.options?.ipfsNode || chainDefaultConfig?.ipfsUploadUrl;

    const missing = [];
    if (!subgraphUrl) missing.push('dataProtectorSubgraph');
    if (!dappAddressOrENS) missing.push('dappAddress');
    if (!dappWhitelistAddress) missing.push('whitelistSmartContract');
    if (!ipfsGateway) missing.push('ipfsGateway');
    if (!defaultWorkerpool) missing.push('prodWorkerpoolAddress');
    if (!ipfsNode) missing.push('ipfsUploadUrl');

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for chainId ${chainId}: ${missing.join(
          ', '
        )}`
      );
    }

    let iexec: IExec, graphQLClient: GraphQLClient;

    try {
      iexec = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...this.options?.iexecOptions,
          allowExperimentalNetworks: this.options.allowExperimentalNetworks,
        }
      );
    } catch (e: any) {
      throw new Error(`Unsupported ethProvider: ${e.message}`);
    }

    try {
      graphQLClient = new GraphQLClient(subgraphUrl);
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    return {
      dappAddressOrENS,
      dappWhitelistAddress: dappWhitelistAddress.toLowerCase(),
      defaultWorkerpool,
      graphQLClient,
      ipfsNode,
      ipfsGateway,
      iexec,
    };
  }
}
