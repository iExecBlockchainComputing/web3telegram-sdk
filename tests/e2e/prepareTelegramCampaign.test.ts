import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import { Contact, IExecWeb3telegram } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  TEST_CHAIN,
  TEST_WEB3TELEGRAM_DAPP_ADDRESS,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  getRandomWallet,
  getTestConfig,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  setBalance,
  setEthForGas,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';

describe('web3telegram.prepareTelegramCampaign()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3telegram: IExecWeb3telegram;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData1: ProtectedDataWithSecretProps;
  let validProtectedData2: ProtectedDataWithSecretProps;
  let validProtectedData3: ProtectedDataWithSecretProps;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;

  beforeAll(async () => {
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      1_000,
      prodWorkerpoolPublicPrice
    );

    providerWallet = getRandomWallet();

    const resourceProvider = new IExec(
      {
        ethProvider: getTestWeb3SignerProvider(
          TEST_CHAIN.appOwnerWallet.privateKey
        ),
      },
      iexecOptions
    );
    await createAndPublishAppOrders(
      resourceProvider,
      TEST_WEB3TELEGRAM_DAPP_ADDRESS
    );

    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );

    await setBalance(providerWallet.address, 10n ** 18n);

    // create valid protected data
    validProtectedData1 = await dataProtector.protectData({
      data: { telegram_chatId: '12345' },
      name: 'bulk test 1',
    });

    validProtectedData2 = await dataProtector.protectData({
      data: { telegram_chatId: '67890' },
      name: 'bulk test 2',
    });

    validProtectedData3 = await dataProtector.protectData({
      data: { telegram_chatId: '11111' },
      name: 'bulk test 3',
    });

    await waitSubgraphIndexing();
  }, 5 * (MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME) + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME + 5_000);

  beforeEach(async () => {
    consumerWallet = getRandomWallet();
    await setEthForGas(consumerWallet.address);

    // Grant access with allowBulk for bulk processing
    await dataProtector.grantAccess({
      authorizedApp: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
      protectedData: validProtectedData1.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
      protectedData: validProtectedData2.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
      protectedData: validProtectedData3.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await waitSubgraphIndexing();
    web3telegram = new IExecWeb3telegram(
      ...getTestConfig(consumerWallet.privateKey)
    );
  }, MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME);

  it(
    'should prepare a telegram campaignRequest',
    async () => {
      // Fetch contacts with allowBulk access
      const contacts: Contact[] = await web3telegram.fetchMyContacts({
        bulkOnly: true,
      });
      expect(contacts.length).toBeGreaterThanOrEqual(3);

      const bulkOrders = contacts.map((contact) => contact.grantedAccess);

      // Process the bulk request
      const result = await web3telegram.prepareTelegramCampaign({
        telegramContent: 'Bulk test message',
        senderName: 'Bulk test sender',
        // protectedData is optional when grantedAccess is provided
        grantedAccesses: bulkOrders,
        maxProtectedDataPerTask: 3,
        workerpoolMaxPrice: prodWorkerpoolPublicPrice,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.campaignRequest).toEqual({
        app: expect.any(String),
        appmaxprice: expect.any(String),
        workerpool: expect.any(String),
        workerpoolmaxprice: expect.any(String),
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        callback: '0x0000000000000000000000000000000000000000',
        params: expect.any(String),
        beneficiary: consumerWallet.address,
        category: '0',
        requester: consumerWallet.address,
        salt: expect.any(String),
        sign: expect.any(String),
        tag: '0x0000000000000000000000000000000000000000000000000000000000000001',
        trust: '0',
        volume: '1',
      });
    },
    30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
  );
});
