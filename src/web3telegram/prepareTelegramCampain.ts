import { Buffer } from 'buffer';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import * as ipfs from '../utils/ipfs-service.js';
import {
  addressOrEnsSchema,
  telegramContentSchema,
  positiveNumberSchema,
  labelSchema,
  throwIfMissing,
  senderNameSchema,
} from '../utils/validators.js';
import { GrantedAccess } from './types.js';
import {
  DappAddressConsumer,
  DataProtectorConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
} from './internalTypes.js';
import { AddressOrENS, BulkRequest } from '@iexec/dataprotector';

export type PrepareTelegramCampaign = typeof prepareTelegramCampaign;

export type PrepareTelegramCampaignParams = {
  /**
   * Granted access to process in bulk.
   * use `fetchMyContacts({ bulkOnly: true })` to get granted accesses.
   * if not provided, the single message will be processed.
   */
  grantedAccess: GrantedAccess[];
  maxProtectedDataPerTask?: number;
  senderName?: string;
  telegramContent: string;
  label?: string;
  workerpoolAddressOrEns?: AddressOrENS;
  dataMaxPrice?: number;
  appMaxPrice?: number;
  workerpoolMaxPrice?: number;
};

export type PrepareTelegramCampaignResponse = {
  campaignRequest: BulkRequest;
};

export const prepareTelegramCampaign = async ({
  iexec = throwIfMissing(),
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  dappAddressOrENS,
  ipfsNode,
  ipfsGateway,
  senderName,
  telegramContent,
  label,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  grantedAccess,
  maxProtectedDataPerTask,
}: IExecConsumer &
  DappAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  DataProtectorConsumer &
  PrepareTelegramCampaignParams): Promise<PrepareTelegramCampaignResponse> => {
  try {
    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
      .required()
      .label('WorkerpoolAddressOrEns')
      .validateSync(workerpoolAddressOrEns);
    const vSenderName = senderNameSchema()
      .label('senderName')
      .validateSync(senderName);
    const vTelegramContent = telegramContentSchema()
      .required()
      .label('telegramContent')
      .validateSync(telegramContent);
    const vLabel = labelSchema().label('label').validateSync(label);
    const vDappAddressOrENS = addressOrEnsSchema()
      .required()
      .label('dappAddressOrENS')
      .validateSync(dappAddressOrENS);
    const vAppMaxPrice = positiveNumberSchema()
      .label('appMaxPrice')
      .validateSync(appMaxPrice);
    const vWorkerpoolMaxPrice = positiveNumberSchema()
      .label('workerpoolMaxPrice')
      .validateSync(workerpoolMaxPrice);
    const vMaxProtectedDataPerTask = positiveNumberSchema()
      .label('maxProtectedDataPerTask')
      .validateSync(maxProtectedDataPerTask);

    // TODO: factor this
    // Encrypt telegram content
    const telegramContentEncryptionKey = iexec.dataset.generateEncryptionKey();
    const encryptedFile = await iexec.dataset
      .encrypt(
        Buffer.from(vTelegramContent, 'utf8'),
        telegramContentEncryptionKey
      )
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to encrypt message content',
          errorCause: e,
        });
      });
    // Push telegram message to IPFS
    const cid = await ipfs
      .add(encryptedFile, {
        ipfsNode,
        ipfsGateway,
      })
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to upload encrypted telegram content',
          errorCause: e,
        });
      });
    const multiaddr = `/ipfs/${cid}`;
    // Prepare secrets for the requester
    // Use a positive integer as secret ID (required by iexec)
    // Using "1" as a fixed ID for the requester secret
    const requesterSecretId = 1;
    const secrets = {
      [requesterSecretId]: JSON.stringify({
        senderName: vSenderName,
        telegramContentMultiAddr: multiaddr,
        telegramContentEncryptionKey,
      }),
    };
    // TODO: end factor this

    const { bulkRequest: campaignRequest } =
      await dataProtector.prepareBulkRequest({
        app: vDappAddressOrENS,
        appMaxPrice: vAppMaxPrice,
        workerpoolMaxPrice: vWorkerpoolMaxPrice,
        workerpool: vWorkerpoolAddressOrEns,
        args: vLabel,
        inputFiles: [],
        secrets,
        bulkAccesses: grantedAccess,
        maxProtectedDataPerTask: vMaxProtectedDataPerTask,
      });
    return { campaignRequest };
  } catch (error) {
    //  Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }
    // Handle protocol errors - this will throw if it's an ApiCallError
    // handleIfProtocolError transforms ApiCallError into a WorkflowError with isProtocolError=true
    handleIfProtocolError(error);
    // For all other errors
    throw new WorkflowError({
      message: 'Failed to prepareTelegramCampaign',
      errorCause: error,
    });
  }
};
