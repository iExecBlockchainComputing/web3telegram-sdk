import { Buffer } from 'buffer';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  telegramContentSchema,
  positiveNumberSchema,
  labelSchema,
  throwIfMissing,
  addressSchema,
  senderNameSchema,
  booleanSchema,
} from '../utils/validators.js';
import { SendTelegramParams, SendTelegramResponse } from './types.js';
import {
  checkUserVoucher,
  filterWorkerpoolOrders,
} from '../utils/sendTelegram.models.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SubgraphConsumer,
} from './internalTypes.js';

export type SendTelegram = typeof sendTelegram;

export const sendTelegram = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
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
  SendTelegramParams): Promise<SendTelegramResponse> => {
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
    const vDappWhitelistAddress = addressSchema()
      .required()
      .label('dappWhitelistAddress')
      .validateSync(dappWhitelistAddress);
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
    const requesterAddress = await iexec.wallet.getAddress();

    let userVoucher;
    if (vUseVoucher) {
      try {
        userVoucher = await iexec.voucher.showUserVoucher(requesterAddress);
        checkUserVoucher({ userVoucher });
      } catch (err) {
        if (err?.message?.startsWith('No Voucher found for address')) {
          throw new Error(
            'Oops, it seems your wallet is not associated with any voucher. Check on https://builder.iex.ec/'
          );
        }
        throw err;
      }
    }
    const [
      datasetorderForApp,
      datasetorderForWhitelist,
      apporder,
      workerpoolorder,
    ] = await Promise.all([
      // Fetch dataset order for web3telegram app
      iexec.orderbook
        .fetchDatasetOrderbook({
          dataset: vDatasetAddress,
          app: dappAddressOrENS,
          requester: requesterAddress,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),

      // Fetch dataset order for web3telegram whitelist
      iexec.orderbook
        .fetchDatasetOrderbook({
          dataset: vDatasetAddress,
          app: vDappWhitelistAddress,
          requester: requesterAddress,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),

      // Fetch app order
      iexec.orderbook
        .fetchAppOrderbook({
          app: dappAddressOrENS,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          workerpool: workerpoolAddressOrEns,
        })
        .then((appOrderbook) => {
          const desiredPriceAppOrderbook = appOrderbook.orders.filter(
            (order) => order.order.appprice <= vAppMaxPrice
          );
          const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
          if (!desiredPriceAppOrder) {
            throw new Error('No App order found for the desired price');
          }
          return desiredPriceAppOrder;
        }),

      // Fetch workerpool order for App or AppWhitelist
      Promise.all([
        // for app
        iexec.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolAddressOrEns,
          app: vDappAddressOrENS,
          dataset: vDatasetAddress,
          requester: requesterAddress, // public orders + user specific orders
          isRequesterStrict: useVoucher, // If voucher, we only want user specific orders
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }),
        // for app whitelist
        iexec.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolAddressOrEns,
          app: vDappWhitelistAddress,
          dataset: vDatasetAddress,
          requester: requesterAddress, // public orders + user specific orders
          isRequesterStrict: useVoucher, // If voucher, we only want user specific orders
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }),
      ]).then(
        ([workerpoolOrderbookForApp, workerpoolOrderbookForAppWhitelist]) => {
          const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
            workerpoolOrders: [
              ...workerpoolOrderbookForApp.orders,
              ...workerpoolOrderbookForAppWhitelist.orders,
            ],
            workerpoolMaxPrice: vWorkerpoolMaxPrice,
            useVoucher: vUseVoucher,
            userVoucher,
          });
          if (!desiredPriceWorkerpoolOrder) {
            throw new Error('No Workerpool order found for the desired price');
          }
          return desiredPriceWorkerpoolOrder;
        }
      ),
    ]);

    const datasetorder = datasetorderForApp || datasetorderForWhitelist;
    if (!datasetorder) {
      throw new Error('No Dataset order found for the desired price');
    }

    // Push requester secrets
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

    const requesterSecretId = generateSecureUniqueId(16);
    await iexec.secrets.pushRequesterSecret(
      requesterSecretId,
      JSON.stringify({
        senderName: vSenderName,
        telegramContentMultiAddr: multiaddr,
        telegramContentEncryptionKey,
      })
    );

    const requestorderToSign = await iexec.order.createRequestorder({
      app: vDappAddressOrENS,
      category: workerpoolorder.category,
      dataset: vDatasetAddress,
      datasetmaxprice: datasetorder.datasetprice,
      appmaxprice: apporder.appprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      tag: ['tee', 'scone'],
      workerpool: vWorkerpoolAddressOrEns,
      params: {
        iexec_secrets: {
          1: requesterSecretId,
        },
        iexec_args: vLabel,
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    // Match orders and compute task ID
    const { dealid } = await iexec.order.matchOrders(
      {
        apporder: apporder,
        datasetorder: datasetorder,
        workerpoolorder: workerpoolorder,
        requestorder: requestorder,
      },
      { useVoucher: vUseVoucher }
    );
    const taskId = await iexec.deal.computeTaskId(dealid, 0);
    return {
      taskId,
    };
  } catch (error) {
    // Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }
    // Handle protocol errors - this will throw if it's an ApiCallError
    // handleIfProtocolError transforms ApiCallError into a WorkflowError with isProtocolError=true
    handleIfProtocolError(error);
    // For all other errors
    throw new WorkflowError({
      message: 'Failed to sendTelegram',
      errorCause: error,
    });
  }
};
