import { expect, it, jest } from '@jest/globals';
import { type SendTelegram } from '../../src/web3telegram/sendTelegram.js';
import { getRandomAddress } from '../test-utils.js';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { mockAllForSendTelegram } from '../utils/mockAllForSendTelegram.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  checkProtectedDataValidity: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/ipfs-service.js', () => ({
  add: jest.fn(() =>
    Promise.resolve('QmSBoN71925mWJ6acehqDLQrrxihxX55EXrqHxpYja4HCG')
  ),
  get: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
}));

jest.unstable_mockModule('@iexec/dataprotector', () => ({
  IExecDataProtectorCore: jest.fn(),
}));

describe('sendTelegram', () => {
  let testedModule: any;
  let sendTelegram: SendTelegram;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  const mockDataProtector = {
    processProtectedData: jest.fn().mockResolvedValue({ taskId: 'task123' } as never),
  };

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
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
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
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
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
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
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
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
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
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
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
    it('should call processProtectedData from dataProtector', async () => {
      //  --- GIVEN
      const { checkProtectedDataValidity } = (await import(
        '../../src/utils/subgraphQuery.js'
      )) as unknown as {
        checkProtectedDataValidity: jest.Mock<() => Promise<boolean>>;
      };
      checkProtectedDataValidity.mockResolvedValue(true);

      const protectedData = getRandomAddress().toLowerCase();
      const iexec = mockAllForSendTelegram() as any;

      // --- WHEN
      await sendTelegram({
        graphQLClient: { request: jest.fn() } as any,
        iexec,
        dataProtector: mockDataProtector as any,
        workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        dappAddressOrENS: defaultConfig.dappAddress,
        dappWhitelistAddress: defaultConfig.whitelistSmartContract,
        ipfsNode: defaultConfig.ipfsUploadUrl,
        ipfsGateway: defaultConfig.ipfsGateway,
        telegramContent: 'e2e telegram content for test',
        protectedData,
      });

      // --- THEN
      expect(mockDataProtector.processProtectedData).toHaveBeenCalledTimes(1);
      expect(mockDataProtector.processProtectedData).toHaveBeenCalledWith(
        expect.objectContaining({
          protectedData: protectedData,
          app: defaultConfig.dappAddress,
          workerpool: defaultConfig.prodWorkerpoolAddress,
        })
      );
    });
  });
});
