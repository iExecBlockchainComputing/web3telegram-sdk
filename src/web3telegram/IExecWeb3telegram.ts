import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExec } from 'iexec';
import { IExecDataProtectorCore } from '@iexec/dataprotector';
import { GraphQLClient } from 'graphql-request';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendTelegram } from './sendTelegram.js';
import { sendTelegramCampaign } from './sendTelegramCampaign.js';
import {
  Contact,
  FetchUserContactsParams,
  SendTelegramParams,
  AddressOrENS,
  Web3TelegramConfigOptions,
  Web3SignerProvider,
  FetchMyContactsParams,
  SendTelegramResponse,
  PrepareTelegramCampaignResponse,
  PrepareTelegramCampaignParams,
  SendTelegramCampaignParams,
  SendTelegramCampaignResponse,
} from './types.js';
import { getChainDefaultConfig } from '../config/config.js';
import { isValidProvider } from '../utils/validators.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';
import { resolveDappAddressFromCompass } from '../utils/resolveDappAddressFromCompass.js';
import { prepareTelegramCampaign } from './prepareTelegramCampain.js';

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
  dataProtector: IExecDataProtectorCore;
}

export class IExecWeb3telegram {
  private dappAddressOrENS!: AddressOrENS;

  private dappWhitelistAddress!: AddressOrENS;

  private graphQLClient!: GraphQLClient;

  private ipfsNode!: string;

  private ipfsGateway!: string;

  private defaultWorkerpool!: string;

  private iexec!: IExec;

  private dataProtector!: IExecDataProtectorCore;

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
        this.dataProtector = config.dataProtector;
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

  async sendTelegramCampaign(
    args: SendTelegramCampaignParams
  ): Promise<SendTelegramCampaignResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return sendTelegramCampaign({
      ...args,
      workerpoolAddressOrEns:
        args.workerpoolAddressOrEns || this.defaultWorkerpool,
      dataProtector: this.dataProtector,
    });
  }

  async prepareTelegramCampaign(
    args: PrepareTelegramCampaignParams
  ): Promise<PrepareTelegramCampaignResponse> {
    await this.init();

    return prepareTelegramCampaign({
      ...args,
      iexec: this.iexec,
      dataProtector: this.dataProtector,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddressOrENS: this.dappAddressOrENS,
    });
  }

  private async resolveConfig(): Promise<Web3telegramResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainDefaultConfig = getChainDefaultConfig(chainId, {
      allowExperimentalNetworks: this.options.allowExperimentalNetworks,
    });

    const ipfsGateway =
      this.options?.ipfsGateway || chainDefaultConfig?.ipfsGateway;

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

    const subgraphUrl =
      this.options?.dataProtectorSubgraph ||
      chainDefaultConfig?.dataProtectorSubgraph;
    const dappAddressOrENS =
      this.options?.dappAddressOrENS ||
      chainDefaultConfig?.dappAddress ||
      (await resolveDappAddressFromCompass(
        await iexec.config.resolveCompassURL(),
        chainId
      ));
    const dappWhitelistAddress =
      this.options?.dappWhitelistAddress ||
      chainDefaultConfig?.whitelistSmartContract;

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

    try {
      graphQLClient = new GraphQLClient(subgraphUrl);
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    const dataProtector = new IExecDataProtectorCore(this.ethProvider, {
      iexecOptions: {
        ipfsGatewayURL: ipfsGateway,
        ...this.options?.iexecOptions,
        allowExperimentalNetworks: this.options.allowExperimentalNetworks,
      },
      ipfsGateway,
      ipfsNode,
      subgraphUrl,
    });

    return {
      dappAddressOrENS,
      dappWhitelistAddress: dappWhitelistAddress.toLowerCase(),
      defaultWorkerpool,
      graphQLClient,
      ipfsNode,
      ipfsGateway,
      iexec,
      dataProtector,
    };
  }
}
