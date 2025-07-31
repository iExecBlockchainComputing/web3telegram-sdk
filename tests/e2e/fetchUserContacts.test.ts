import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
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

  describe('when no access is granted', () => {
    it(
      'should return an empty contact array',
      async () => {
        const noAccessUser = Wallet.createRandom().address;

        const contacts = await web3telegram.fetchUserContacts({
          userAddress: noAccessUser,
          isUserStrict: true,
        });

        expect(contacts.length).toBe(0);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('when access is granted', () => {
    it('contacts should contain name, accessPrice, remainingAccess, owner, accessGrantTimestamp, and isUserStrict', async () => {
      const userWithAccess = Wallet.createRandom().address;

      await web3telegram.init();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const authorizedApp = web3telegram['dappAddressOrENS'];

      await dataProtector.grantAccess({
        authorizedApp: authorizedApp,
        protectedData: protectedData1.address,
        authorizedUser: userWithAccess,
      });

      const contacts = await web3telegram.fetchUserContacts({
        userAddress: userWithAccess,
        isUserStrict: true,
      });
      expect(contacts.length).toBe(1);
      expect(contacts[0].address).toBe(protectedData1.address.toLowerCase());
      expect(contacts[0].owner).toBeDefined();
      expect(contacts[0].accessPrice).toBe(0);
      expect(contacts[0].remainingAccess).toBe(1);
      expect(contacts[0].accessGrantTimestamp).toBeDefined();
      expect(contacts[0].isUserStrict).toBe(true);
      expect(contacts[0].name).toBe('test do not use');
    });

    it(
      'should return the user contacts for both app and whitelist',
      async () => {
        const userWithAccess = Wallet.createRandom().address;
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;
        const authorizedWhitelist = defaultConfig!.whitelistSmartContract;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: userWithAccess,
        });

        await dataProtector.grantAccess({
          authorizedApp: authorizedWhitelist,
          protectedData: protectedData2.address,
          authorizedUser: userWithAccess,
        });

        const contacts = await web3telegram.fetchUserContacts({
          userAddress: userWithAccess,
          isUserStrict: true,
        });
        expect(contacts.length).toBe(2);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'Two different user should have different contacts',
      async () => {
        const user1 = Wallet.createRandom().address;
        const user2 = Wallet.createRandom().address;
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        await dataProtector.grantAccess({
          authorizedApp: defaultConfig.dappAddress,
          protectedData: protectedData1.address,
          authorizedUser: user1,
        });

        await dataProtector.grantAccess({
          authorizedApp: defaultConfig.dappAddress,
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
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        await dataProtector.grantAccess({
          authorizedApp: defaultConfig.dappAddress,
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
  });

  describe('when iexec market API is not reachable', () => {
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
  });

  describe('when subgraph is not reachable', () => {
    it(
      'should throw a fetchUserContacts error',
      async () => {
        // Call getTestConfig to get the default configuration
        const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);

        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: ethProvider.address,
        });

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
});
