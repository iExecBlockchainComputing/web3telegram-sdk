import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { WEB3TELEGRAM_DAPP_ADDRESS } from '../../src/config/config.js';
import { IExecWeb3telegram, WorkflowError } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
  waitSubgraphIndexing,
} from '../test-utils.js';

describe('web3telegram.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3telegram: IExecWeb3telegram;
  let dataProtector: IExecDataProtectorCore;
  let protectedData1: ProtectedDataWithSecretProps;
  let protectedData2: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    web3telegram = new IExecWeb3telegram(...getTestConfig(wallet.privateKey));

    //create valid protected data
    protectedData1 = await dataProtector.protectData({
      data: { telegram_chatId: '1234' },
      name: 'test do not use',
    });
    protectedData2 = await dataProtector.protectData({
      data: { telegram_chatId: '5678' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'Tow different user should have different contacts',
    async () => {
      const user1 = Wallet.createRandom().address;
      const user2 = Wallet.createRandom().address;
      await dataProtector.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: protectedData1.address,
        authorizedUser: user1,
      });

      await dataProtector.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: protectedData2.address,
        authorizedUser: user2,
      });

      const contactUser1 = await web3telegram.fetchUserContacts({
        userAddress: user1,
      });
      const contactUser2 = await web3telegram.fetchUserContacts({
        userAddress: user2,
      });
      expect(contactUser1).not.toEqual(contactUser2);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'Test that the protected data can be accessed by authorized user',
    async () => {
      const userWithAccess = Wallet.createRandom().address;
      await dataProtector.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: protectedData1.address,
        authorizedUser: userWithAccess,
      });

      const contacts = await web3telegram.fetchUserContacts({
        userAddress: userWithAccess,
      });
      expect(contacts.length).toBeGreaterThan(0);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw a protocol error',
    async () => {
      // Call getTestConfig to get the default configuration
      const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);
      const user1 = Wallet.createRandom().address;

      const options = {
        ...defaultOptions,
        iexecOptions: {
          ...defaultOptions.iexecOptions,
          iexecGatewayURL: 'https://test',
        },
      };

      // Pass the modified options to IExecWeb3telegram
      const invalidWeb3telegram = new IExecWeb3telegram(ethProvider, options);
      let error: WorkflowError | undefined;

      try {
        await invalidWeb3telegram.fetchUserContacts({
          userAddress: user1,
        });
      } catch (err) {
        error = err as WorkflowError;
      }

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error?.message).toBe(
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
      );
      expect(error?.isProtocolError).toBe(true);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw a fetchUserContacts error',
    async () => {
      // Call getTestConfig to get the default configuration
      const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);

      const options = {
        ...defaultOptions,
        dataProtectorSubgraph: 'https://test',
      };

      // Pass the modified options to IExecWeb3telegram
      const invalidWeb3telegram = new IExecWeb3telegram(ethProvider, options);
      let error: WorkflowError | undefined;

      try {
        await invalidWeb3telegram.fetchMyContacts();
      } catch (err) {
        error = err as WorkflowError;
      }

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error?.message).toBe('Failed to fetch user contacts');
      expect(error?.isProtocolError).toBe(false);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
