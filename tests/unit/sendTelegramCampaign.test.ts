import { expect, it, jest, describe, beforeAll } from '@jest/globals';
import { type SendTelegramCampaign } from '../../src/web3telegram/sendTelegramCampaign.js';
import { getRandomAddress } from '../test-utils.js';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { BulkRequest } from '@iexec/dataprotector';

describe('sendTelegramCampaign', () => {
  let testedModule: any;
  let sendTelegramCampaign: SendTelegramCampaign;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import(
      '../../src/web3telegram/sendTelegramCampaign.js'
    );
    sendTelegramCampaign = testedModule.sendTelegramCampaign;
  });

  describe('Bulk processing', () => {
    it('should call processBulkRequest with default workerpool when campaignRequest is provided', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: '{"bulk_cid":"QmV8mtkG5qjAYjMGGkm6AKdXoXSZxfi1Wqbem4uX4oi9QM"}',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockResponse = {
        tasks: [
          { taskId: 'mock-task-id-1', dealId: 'mock-deal-id-1', bulkIndex: 0 },
          { taskId: 'mock-task-id-2', dealId: 'mock-deal-id-2', bulkIndex: 1 },
        ],
      };

      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue(mockResponse),
      } as any;

      // --- WHEN
      const result = await sendTelegramCampaign({
        dataProtector: mockDataprotector,
        workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        campaignRequest: mockCampaignRequest,
      });

      // --- THEN
      expect(mockDataprotector.processBulkRequest).toHaveBeenCalledTimes(1);
      expect(mockDataprotector.processBulkRequest).toHaveBeenCalledWith({
        bulkRequest: mockCampaignRequest,
        workerpool: defaultConfig.prodWorkerpoolAddress,
      });
      expect(result).toEqual(mockResponse);
      expect('tasks' in result).toBe(true);
      const tasks = 'tasks' in result ? result.tasks : [];
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(2);
    });

    it('should return ProcessBulkRequestResponse with correct structure', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: '{"bulk_cid":"QmV8mtkG5qjAYjMGGkm6AKdXoXSZxfi1Wqbem4uX4oi9QM"}',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockResponse = {
        tasks: [
          { taskId: 'task-1', dealId: 'deal-1', bulkIndex: 0 },
          { taskId: 'task-2', dealId: 'deal-2', bulkIndex: 1 },
          { taskId: 'task-3', dealId: 'deal-3', bulkIndex: 2 },
        ],
      };

      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue(mockResponse),
      } as any;

      // --- WHEN
      const result = await sendTelegramCampaign({
        dataProtector: mockDataprotector,
        workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        campaignRequest: mockCampaignRequest,
      });

      // --- THEN
      expect(result).toEqual(mockResponse);
      expect('tasks' in result).toBe(true);
      const tasks = 'tasks' in result ? result.tasks : [];
      expect(tasks.length).toBe(3);
      tasks.forEach((task) => {
        expect(task).toHaveProperty('taskId');
        expect(task).toHaveProperty('dealId');
        expect(task).toHaveProperty('bulkIndex');
      });
    });

    it('should use default workerpool when not provided', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: '{"bulk_cid":"QmV8mtkG5qjAYjMGGkm6AKdXoXSZxfi1Wqbem4uX4oi9QM"}',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockResponse = {
        tasks: [{ taskId: 'task-1', dealId: 'deal-1', bulkIndex: 0 }],
      };

      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue(mockResponse),
      } as any;

      // --- WHEN
      await sendTelegramCampaign({
        dataProtector: mockDataprotector,
        workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        campaignRequest: mockCampaignRequest,
      });

      // --- THEN
      expect(mockDataprotector.processBulkRequest).toHaveBeenCalledWith({
        bulkRequest: mockCampaignRequest,
        workerpool: defaultConfig.prodWorkerpoolAddress,
      });
    });

    it('should throw error when campaignRequest is not provided', async () => {
      // --- GIVEN
      const mockDataprotector = {
        processBulkRequest: jest.fn(),
      } as any;

      // --- WHEN & THEN
      // throwIfMissing() throws ValidationError "Missing parameter" which is caught and transformed to WorkflowError
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          // campaignRequest is not provided
        } as any)
      ).rejects.toThrow();

      // Verify it's a WorkflowError with the expected message
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        } as any)
      ).rejects.toMatchObject({
        message: expect.stringMatching(
          /Failed to sendTelegramCampaign|Missing parameter/
        ),
      });

      expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
    });

    it('should handle errors correctly', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: 'test',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockError = new Error('Test error');
      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockRejectedValue(mockError),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          campaignRequest: mockCampaignRequest,
        })
      ).rejects.toMatchObject({
        message: 'Failed to sendTelegramCampaign',
      });
    });

    it('should throw error when workerpoolAddressOrEns is not provided', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: 'test',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockDataprotector = {
        processBulkRequest: jest.fn(),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          campaignRequest: mockCampaignRequest,
          // workerpoolAddressOrEns is not provided
        } as any)
      ).rejects.toMatchObject({
        message: expect.stringMatching(
          /Failed to sendTelegramCampaign|Missing parameter/
        ),
      });

      expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
    });

    it('should throw error when dataProtector is not provided', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: 'test',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          // dataProtector is not provided
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          campaignRequest: mockCampaignRequest,
        } as any)
      ).rejects.toMatchObject({
        message: expect.stringMatching(
          /Failed to sendTelegramCampaign|Missing parameter/
        ),
      });
    });

    it('should throw error when workerpoolAddressOrEns is invalid', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: 'test',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockDataprotector = {
        processBulkRequest: jest.fn(),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: 'invalid-address',
          campaignRequest: mockCampaignRequest,
        })
      ).rejects.toMatchObject({
        message: 'Failed to sendTelegramCampaign',
        cause: expect.objectContaining({
          name: 'ValidationError',
        }),
      });

      expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
    });

    it('should throw error when campaignRequest is null', async () => {
      // --- GIVEN
      const mockDataprotector = {
        processBulkRequest: jest.fn(),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          campaignRequest: null as any, // Invalid campaignRequest
        })
      ).rejects.toMatchObject({
        message: 'Failed to sendTelegramCampaign',
        cause: expect.objectContaining({
          name: 'ValidationError',
        }),
      });

      expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
    });

    it('should re-throw protocol errors without modification', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: '{"bulk_cid":"QmV8mtkG5qjAYjMGGkm6AKdXoXSZxfi1Wqbem4uX4oi9QM"}',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const protocolError = new Error('Protocol error');
      (protocolError as any).isProtocolError = true;

      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockRejectedValue(protocolError),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          campaignRequest: mockCampaignRequest,
        })
      ).rejects.toBe(protocolError);
    });

    it('should handle "Failed to process protected data" error', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: 'test',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const processError = new Error('Failed to process protected data');
      const mockDataprotector = {
        processBulkRequest: jest
          .fn<() => Promise<any>>()
          .mockRejectedValue(processError),
      } as any;

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          campaignRequest: mockCampaignRequest,
        })
      ).rejects.toMatchObject({
        message: 'Failed to sendTelegramCampaign',
      });
    });

    it('should throw error when workerpoolAddressOrEns does not match campaignRequest.workerpool', async () => {
      // --- GIVEN
      const mockCampaignRequest: BulkRequest = {
        app: '0x0000000000000000000000000000000000000000',
        appmaxprice: '1000',
        workerpool: '0x000000000000000000000000000000000000dead',
        workerpoolmaxprice: '1000',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: '{"bulk_cid":"QmV8mtkG5qjAYjMGGkm6AKdXoXSZxfi1Wqbem4uX4oi9QM"}',
        requester: getRandomAddress().toLowerCase(),
        beneficiary: getRandomAddress().toLowerCase(),
        callback: '0x0000000000000000000000000000000000000000',
        category: '0',
        volume: '1',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const mockDataprotector = {
        processBulkRequest: jest.fn(),
      } as any;

      const differentWorkerpool = getRandomAddress();

      // --- WHEN & THEN
      await expect(
        sendTelegramCampaign({
          dataProtector: mockDataprotector,
          workerpoolAddressOrEns: differentWorkerpool,
          campaignRequest: mockCampaignRequest,
        })
      ).rejects.toMatchObject({
        message: 'Failed to sendTelegramCampaign',
        cause: expect.objectContaining({
          name: 'ValidationError',
          message:
            "workerpoolAddressOrEns doesn't match campaignRequest workerpool",
        }),
      });

      expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
    });
  });
});
