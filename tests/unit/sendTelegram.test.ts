import { expect, it, jest } from '@jest/globals';
import { type SendTelegram } from '../../src/web3telegram/sendTelegram.js';
import { getRandomAddress } from '../test-utils.js';
import { CHAIN_CONFIG, CHAIN_IDS } from '../../src/config/config.js';
import { mockAllForSendTelegram } from '../utils/mockAllForSendTelegram.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  checkProtectedDataValidity: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/ipfs-service.js', () => ({
  add: jest.fn(() => Promise.resolve('QmSBoN71925mWJ6acehqDLQrrxihxX55EXrqHxpYja4HCG')),
  get: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
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
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendTelegram() as any,
            workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
            dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
            dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
            ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
            ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
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
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendTelegram() as any,
            workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
            dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
            dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
            ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
            ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
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
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendTelegram() as any,
            workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
            dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
            dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
            ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
            ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
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
          sendTelegram({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendTelegram() as any,
            workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
            dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
            dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
            ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
            ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
            ...sendTelegramParams,
          })
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
          sendTelegram({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendTelegram() as any,
            workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
            dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
            dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
            ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
            ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
            ...sendTelegramParams,
          })
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
      const iexec = mockAllForSendTelegram() as any;

      const userAddress = await iexec.wallet.getAddress();

      // --- WHEN
      await sendTelegram({
        graphQLClient: { request: jest.fn() } as any,
        iexec,
        workerpoolAddressOrEns: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
        dappAddressOrENS: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress,
        dappWhitelistAddress: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract,
        ipfsNode: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsUploadUrl,
        ipfsGateway: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway,
        telegramContent: 'e2e telegram content for test',
        protectedData,
      });

      // --- THEN
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenCalledTimes(2);
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        1,
        {
          workerpool: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
          app: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dappAddress.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          isRequesterStrict: false,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }
      );
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        2,
        {
          workerpool: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
          app: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          isRequesterStrict: false,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }
      );
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        2,
        {
          workerpool: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].prodWorkerpoolAddress,
          app: CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].whitelistSmartContract.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          isRequesterStrict: false,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }
      );
    });
  });
});
