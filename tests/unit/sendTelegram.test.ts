import { expect, it, jest } from '@jest/globals';
import { type SendTelegram } from '../../src/web3telegram/sendTelegram.js';
import { getRandomAddress, TEST_CHAIN } from '../test-utils.js';
import {
  WEB3TELEGRAM_DAPP_ADDRESS,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../../src/config/config.js';
import { mockAllForSendTelegram } from '../utils/mockAllForSendTelegram.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  checkProtectedDataValidity: jest.fn(),
}));

describe('sendTelegram', () => {
  let testedModule: any;
  let sendTelegram: SendTelegram;

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import('../../src/web3telegram/sendTelegram.js');
    sendTelegram = testedModule.sendTelegram;
  });

  describe('Check validation for input parameters', () => {
    describe('When senderName is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendTelegramParams = {
          telegramContent: 'e2e telegram content for test',
          protectedData: getRandomAddress(),
          senderName: 'AB', // <--
        };

        await expect(
          sendTelegram({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            senderName: 'AB', // Trop court, déclenche l'erreur Yup
            ...sendTelegramParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendTelegram',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'senderName must be at least 3 characters',
            ]),
          }),
        });
      });
    });

    describe('When senderName is more than 20 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendTelegramParams = {
          telegramContent: 'e2e telegram content for test',
          protectedData: getRandomAddress(),
          senderName: 'A very long sender name', // <-- 23 characters
        };

        await expect(
          sendTelegram({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            senderName: 'AB', // Trop court, déclenche l'erreur Yup
            ...sendTelegramParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendTelegram',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'senderName must be at most 20 characters',
            ]),
          }),
        });
      });
    });

    describe('When label is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendTelegramParams = {
          telegramContent: 'e2e telegram content for test',
          protectedData: getRandomAddress(),
          label: 'ID', // <-- 23 characters
        };

        await expect(
          sendTelegram({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendTelegramParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendTelegram',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'label must be at least 3 characters',
            ]),
          }),
        });
      });
    });

    describe('When label is more than 10 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendTelegramParams = {
          telegramContent: 'e2e telegram content for test',
          protectedData: getRandomAddress(),
          label: 'ID123456789', // <-- 11 characters
        };

        await expect(
          // --- WHEN
          sendTelegram({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendTelegramParams,
          })
          // --- THEN
        ).rejects.toMatchObject({
          message: 'Failed to sendTelegram',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'label must be at most 10 characters',
            ]),
          }),
        });
      });
    });

    describe('When telegramContent is more than 512kb (too big)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const desiredSizeInBytes = 520000; // 520 kilo-bytes
        const characterToRepeat = 'A';
        const OVERSIZED_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);
        const sendTelegramParams = {
          telegramContent: OVERSIZED_CONTENT,
          protectedData: getRandomAddress(),
        };

        await expect(
          // --- WHEN
          sendTelegram({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendTelegramParams,
          })
          // --- THEN
        ).rejects.toMatchObject({
          message: 'Failed to sendTelegram',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'telegramContent must be at most 512000 characters',
            ]),
          }),
        });
      });
    });
  });

  describe('Orders fetching', () => {
    it('should call fetchWorkerpoolOrderbook for App & Whitelist', async () => {
      //  --- GIVEN
      const { checkProtectedDataValidity } = (await import(
        '../../src/utils/subgraphQuery.js'
      )) as unknown as {
        checkProtectedDataValidity: jest.Mock<() => Promise<boolean>>;
      };
      checkProtectedDataValidity.mockResolvedValue(true);

      const protectedData = getRandomAddress().toLowerCase();
      const iexec = mockAllForSendTelegram();

      const userAddress = await iexec.wallet.getAddress();

      // --- WHEN
      await sendTelegram({
        // @ts-expect-error No need for graphQLClient here
        graphQLClient: {},
        // @ts-expect-error No need for iexec here
        iexec,
        // // @ts-expect-error No need
        // ipfsNode: "",
        // ipfsGateway: this.ipfsGateway,
        dappAddressOrENS: WEB3TELEGRAM_DAPP_ADDRESS,
        dappWhitelistAddress: WHITELIST_SMART_CONTRACT_ADDRESS.toLowerCase(),
        telegramContent: 'e2e telegram content for test',
        protectedData,
      });

      // --- THEN
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenCalledTimes(2);
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        1,
        {
          workerpool: TEST_CHAIN.prodWorkerpool,
          app: WEB3TELEGRAM_DAPP_ADDRESS.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }
      );
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        2,
        {
          workerpool: TEST_CHAIN.prodWorkerpool,
          app: WHITELIST_SMART_CONTRACT_ADDRESS.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }
      );
      // TODO enable this test when prod whitelist is implemented and app ens prod is available
      // expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
      //   2,
      //   {
      //     workerpool: TEST_CHAIN.prodWorkerpool,
      //     app: WHITELIST_SMART_CONTRACT_ADDRESS.toLowerCase(),
      //     dataset: protectedData,
      //     requester: userAddress,
      //     isRequesterStrict: false,
      //     minTag: ['tee', 'scone'],
      //     maxTag: ['tee', 'scone'],
      //     category: 0,
      //   }
      // );
    });
  });
});
