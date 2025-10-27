import { Buffer } from 'buffer';
import { IExecDataProtectorCore } from '@iexec/dataprotector';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  telegramContentSchema,
  positiveNumberSchema,
  labelSchema,
  throwIfMissing,
  senderNameSchema,
  booleanSchema,
} from '../utils/validators.js';
import { SendTelegramParams, SendTelegramResponse } from './types.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  DataProtectorConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SubgraphConsumer,
} from './internalTypes.js';

export type SendTelegram = typeof sendTelegram;

export const sendTelegram = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  dappAddressOrENS,
  dappWhitelistAddress,
  ipfsNode,
  ipfsGateway,
  senderName,
  telegramContent,
  label,
  dataMaxPrice = MAX_DESIRED_DATA_ORDER_PRICE,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  protectedData,
  useVoucher = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  SendTelegramParams &
  DataProtectorConsumer): Promise<SendTelegramResponse> => {
  try {
    const vDatasetAddress = addressOrEnsSchema()
      .required()
      .label('protectedData')
      .validateSync(protectedData);
    const vSenderName = senderNameSchema()
      .label('senderName')
      .validateSync(senderName);
    const vTelegramContent = telegramContentSchema()
      .required()
      .label('telegramContent')
      .validateSync(telegramContent);
    const vLabel = labelSchema().label('label').validateSync(label);
    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
      .required()
      .label('WorkerpoolAddressOrEns')
      .validateSync(workerpoolAddressOrEns);
    const vDappAddressOrENS = addressOrEnsSchema()
      .required()
      .label('dappAddressOrENS')
      .validateSync(dappAddressOrENS);
    // TODO: remove this once we have a way to pass appWhitelist to processProtectedData function
    // const vDappWhitelistAddress = addressSchema()
    //   .required()
    //   .label('dappWhitelistAddress')
    //   .validateSync(dappWhitelistAddress);
    const vDataMaxPrice = positiveNumberSchema()
      .label('dataMaxPrice')
      .validateSync(dataMaxPrice);
    const vAppMaxPrice = positiveNumberSchema()
      .label('appMaxPrice')
      .validateSync(appMaxPrice);
    const vWorkerpoolMaxPrice = positiveNumberSchema()
      .label('workerpoolMaxPrice')
      .validateSync(workerpoolMaxPrice);
    const vUseVoucher = booleanSchema()
      .label('useVoucher')
      .validateSync(useVoucher);

    // Check protected data validity through subgraph
    const isValidProtectedData = await checkProtectedDataValidity(
      graphQLClient,
      vDatasetAddress
    );
    if (!isValidProtectedData) {
      throw new Error(
        'This protected data does not contain "telegram_chatId:string" in its schema.'
      );
    }

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

    // Use processProtectedData from dataprotector
    const result = await dataProtector.processProtectedData({
      iexec,
      defaultWorkerpool: vWorkerpoolAddressOrEns,
      protectedData: vDatasetAddress,
      app: vDappAddressOrENS,
      // userWhitelist: vDappWhitelistAddress, // Removed due to bug in dataprotector v2.0.0-beta.20
      dataMaxPrice: vDataMaxPrice,
      appMaxPrice: vAppMaxPrice,
      workerpoolMaxPrice: vWorkerpoolMaxPrice,
      workerpool: vWorkerpoolAddressOrEns,
      args: vLabel,
      inputFiles: [],
      secrets,
      useVoucher: vUseVoucher,
      waitForResult: false,
    });

    return {
      taskId: result.taskId,
    };
  } catch (error) {
    //  Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }

    // Handle protocol errors - this will throw if it's an ApiCallError
    // handleIfProtocolError transforms ApiCallError into a WorkflowError with isProtocolError=true
    handleIfProtocolError(error);

    // If we reach here, it's not a protocol error
    // Check if it's a WorkflowError from processProtectedData by checking the message
    const isProcessProtectedDataError =
      error instanceof Error &&
      error.message === 'Failed to process protected data';

    if (isProcessProtectedDataError) {
      const cause = (error as any)?.cause;
      // Return unwrapped cause (the actual Error object)
      // error.cause should be an Error, but ensure it is
      const unwrappedCause = cause instanceof Error ? cause : error;
      throw new WorkflowError({
        message: 'Failed to sendTelegram',
        errorCause: unwrappedCause,
      });
    }

    // For all other errors
    throw new WorkflowError({
      message: 'Failed to sendTelegram',
      errorCause: error,
    });
  }
};
