import { PrepareBulkRequestResponse } from '@iexec/dataprotector';
import { EnhancedWallet } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type Web3SignerProvider = EnhancedWallet;

export type ENS = string;

export type AddressOrENS = Address | ENS;

export type Address = string;

export type TimeStamp = string;

export type GrantedAccess = {
  dataset: string;
  datasetprice: string;
  volume: string;
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
  remainingAccess: number;
};

export type Contact = {
  address: Address;
  owner: Address;
  accessGrantTimestamp: TimeStamp;
  isUserStrict: boolean;
  name?: string;
  remainingAccess: number;
  accessPrice: number;
  grantedAccess: GrantedAccess;
};

export type SendTelegramParams = {
  senderName?: string;
  telegramContent: string;
  protectedData: Address;
  label?: string;
  workerpoolAddressOrEns?: AddressOrENS;
  dataMaxPrice?: number;
  appMaxPrice?: number;
  workerpoolMaxPrice?: number;
  useVoucher?: boolean;
};

export type FetchMyContactsParams = {
  /**
   * Get contacts for this specific user only
   */
  isUserStrict?: boolean;
};

export type FetchUserContactsParams = {
  /**
   * Address of the user
   */
  userAddress: Address;
} & FetchMyContactsParams;

export type SendTelegramResponse = {
  taskId: string;
};

/**
 * Configuration options for web3telegram.
 */
export type Web3TelegramConfigOptions = {
  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for the telegram sender dapp.
   * If not provided, the default web3telegram address for the detected chain will be used.
   */
  dappAddressOrENS?: AddressOrENS;

  /**
   * The Ethereum contract address for the whitelist.
   * If not provided, the default whitelist smart contract address for the detected chain will be used.
   */
  dappWhitelistAddress?: Address;

  /**
   * The subgraph URL for querying data.
   * If not provided, the default data protector subgraph URL for the detected chain will be used.
   */
  dataProtectorSubgraph?: string;

  /**
   * Options specific to iExec integration.
   * If not provided, default iexec options will be used.
   */
  iexecOptions?: IExecConfigOptions;

  /**
   * The IPFS node URL.
   * If not provided, the default IPFS node URL for the detected chain will be used.
   */
  ipfsNode?: string;

  /**
   * The IPFS gateway URL.
   * If not provided, the default IPFS gateway URL for the detected chain will be used.
   */
  ipfsGateway?: string;

  /**
   * if true allows using a provider connected to an experimental networks (default false)
   *
   * ⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.
   */
  allowExperimentalNetworks?: boolean;
};
