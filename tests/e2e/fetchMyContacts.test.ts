import { IExecDataProtector } from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { WEB3TELEGRAM_DAPP_ADDRESS } from '../../src/config/config.js';
import { IExecWeb3telegram } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomDataset,
  getTestConfig,
  getTestWeb3SignerProvider,
  getTestIExecOption,
  waitSubgraphIndexing,
} from '../test-utils.js';
import IExec from 'iexec/IExec';

describe('web3telegram.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3telegram: IExecWeb3telegram;
  let dataProtector: IExecDataProtector;
  let protectedData: any;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    web3telegram = new IExecWeb3telegram(...getTestConfig(wallet.privateKey));
    protectedData = await dataProtector.core.protectData({
      data: { chatId: '1461320872' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'pass with a granted access for a specific requester',
    async () => {
      await dataProtector.core.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: wallet.address,
      });
      const res = await web3telegram.fetchMyContacts();
      const foundContactForASpecificRequester = res.find((obj) => {
        return obj.address === protectedData.address.toLocaleLowerCase();
      });
      expect(
        foundContactForASpecificRequester &&
          foundContactForASpecificRequester.address
      ).toBeDefined();
      expect(
        foundContactForASpecificRequester &&
          foundContactForASpecificRequester.address
      ).toBe(protectedData.address.toLocaleLowerCase());
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'pass with a granted access for any requester',
    async () => {
      const grantedAccessForAnyRequester = await dataProtector.core.grantAccess(
        {
          authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
          protectedData: protectedData.address,
          authorizedUser: NULL_ADDRESS,
        }
      );

      const res = await web3telegram.fetchMyContacts();

      const foundContactForAnyRequester = res.find(
        (obj) => obj.address === protectedData.address.toLowerCase()
      );
      expect(
        foundContactForAnyRequester && foundContactForAnyRequester.address
      ).toBeDefined();
      expect(
        foundContactForAnyRequester && foundContactForAnyRequester.address
      ).toBe(protectedData.address.toLocaleLowerCase());

      //revoke access to not appear as contact for anyone
      const revoke = await dataProtector.core.revokeOneAccess(
        grantedAccessForAnyRequester
      );
      expect(revoke).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'Should not return dataset as a contact',
    async () => {
      const iexecOptions = getTestIExecOption();

      const iexec = new IExec(
        { ethProvider: getTestWeb3SignerProvider(wallet.privateKey) },
        iexecOptions
      );
      const dataset = await deployRandomDataset(iexec);
      const encryptionKey = await iexec.dataset.generateEncryptionKey();
      await iexec.dataset.pushDatasetSecret(dataset.address, encryptionKey);
      await dataProtector.core.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: dataset.address,
        authorizedUser: wallet.address,
      });
      const myContacts = await web3telegram.fetchMyContacts();
      expect(myContacts.map(({ address }) => address)).not.toContain(
        dataset.address
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should return only contacts that have a valid telegram chatId',
    async () => {
      const notValidProtectedData = await dataProtector.core.protectData({
        data: { noteChatId: '@*%' },
        name: 'test do not use',
      });
      await waitSubgraphIndexing();

      await dataProtector.core.grantAccess({
        authorizedApp: WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: notValidProtectedData.address,
        authorizedUser: wallet.address,
      });

      const res = await web3telegram.fetchMyContacts();

      expect(
        res.filter(
          (contact) => contact.address === notValidProtectedData.address
        )
      ).toStrictEqual([]);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
