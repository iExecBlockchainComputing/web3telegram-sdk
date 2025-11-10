import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { Contact, IExecWeb3telegram } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  getRandomWallet,
  getTestConfig,
  waitSubgraphIndexing,
} from '../test-utils.js';

describe('web3telegram.prepareTelegramCampaign()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3telegram: IExecWeb3telegram;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData1: ProtectedDataWithSecretProps;
  let validProtectedData2: ProtectedDataWithSecretProps;
  let validProtectedData3: ProtectedDataWithSecretProps;
  const prodWorkerpoolPublicPrice = 1000;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  beforeAll(async () => {
    // Create app orders
    providerWallet = getRandomWallet();

    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );

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
  }, 5 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  beforeEach(async () => {
    consumerWallet = getRandomWallet();

    // Grant access with allowBulk for bulk processing
    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
      protectedData: validProtectedData1.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
      protectedData: validProtectedData2.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
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
      const contacts: Contact[] = await web3telegram.fetchMyContacts();
      expect(contacts.length).toBeGreaterThanOrEqual(3);

      const bulkOrders = contacts.map((contact) => contact.grantedAccess);

      // Process the bulk request
      const result = await web3telegram.prepareTelegramCampaign({
        telegramContent: 'Bulk test message',
        senderName: 'Bulk test sender',
        // protectedData is optional when grantedAccess is provided
        grantedAccess: bulkOrders,
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
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: '0',
        volume: '1',
      });
    },
    30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
  );
});
