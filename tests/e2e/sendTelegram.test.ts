import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
  WorkflowError,
} from '@iexec/dataprotector';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import {
  IExecWeb3telegram,
  WorkflowError as Web3TelegramWorkflowError,
} from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  TEST_CHAIN,
  TEST_WEB3TELEGRAM_DAPP_ADDRESS,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  ensureSufficientStake,
  getId,
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

describe('web3telegram.sendTelegram()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3telegram: IExecWeb3telegram;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData: ProtectedDataWithSecretProps;
  let invalidProtectedData: ProtectedDataWithSecretProps;
  let consumerIExecInstance: IExec;
  let learnProdWorkerpoolAddress: string;
  const iexecOptions = getTestIExecOption();

  beforeAll(async () => {
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      0,
      10_000
    );
    providerWallet = getRandomWallet();
    await setBalance(providerWallet.address, 10n ** 18n);
    const ethProvider = getTestWeb3SignerProvider(
      TEST_CHAIN.appOwnerWallet.privateKey
    );
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    await createAndPublishAppOrders(
      resourceProvider,
      TEST_WEB3TELEGRAM_DAPP_ADDRESS
    );

    learnProdWorkerpoolAddress = TEST_CHAIN.prodWorkerpool;

    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );
    validProtectedData = await dataProtector.protectData({
      data: { telegram_chatId: '12345' },
      name: 'test do not use',
    });
    invalidProtectedData = await dataProtector.protectData({
      data: { foo: 'bar' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  beforeEach(async () => {
    consumerWallet = getRandomWallet();
    await setEthForGas(consumerWallet.address);
    const consumerEthProvider = getTestWeb3SignerProvider(
      consumerWallet.privateKey
    );
    consumerIExecInstance = new IExec(
      { ethProvider: consumerEthProvider },
      iexecOptions
    );
    await dataProtector.grantAccess({
      authorizedApp: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
      protectedData: validProtectedData.address,
      authorizedUser: consumerWallet.address,
      numberOfAccess: 1000,
    });
    web3telegram = new IExecWeb3telegram(
      ...getTestConfig(consumerWallet.privateKey)
    );
  });

  describe('when using the default (not free) prod workerpool', () => {
    let paidWorkerpoolAddress: string;
    const prodWorkerpoolPublicPrice = 1000;

    beforeAll(async () => {
      // Deploy a fresh workerpool so it has no pre-existing free orders from the fork
      await setEthForGas(TEST_CHAIN.prodWorkerpoolOwnerWallet.address);
      const workerpoolOwnerEthProvider = getTestWeb3SignerProvider(
        TEST_CHAIN.prodWorkerpoolOwnerWallet.privateKey
      );
      const workerpoolOwnerIexec = new IExec(
        { ethProvider: workerpoolOwnerEthProvider },
        iexecOptions
      );
      const { address } =
        await workerpoolOwnerIexec.workerpool.deployWorkerpool({
          owner: TEST_CHAIN.prodWorkerpoolOwnerWallet.address,
          description: `paid test workerpool ${getId()}`,
        });
      paidWorkerpoolAddress = address;
      await createAndPublishWorkerpoolOrder(
        paidWorkerpoolAddress,
        TEST_CHAIN.prodWorkerpoolOwnerWallet,
        NULL_ADDRESS,
        prodWorkerpoolPublicPrice,
        10
      );
    }, 3 * MAX_EXPECTED_BLOCKTIME);

    describe('when using the user does not set the workerpoolMaxPrice', () => {
      it(
        'should throw an error No Workerpool order found for the desired price',
        async () => {
          let error!: Error;
          await web3telegram
            .sendTelegram({
              telegramContent: 'e2e telegram content for test',
              protectedData: validProtectedData.address,
              workerpoolAddress: paidWorkerpoolAddress,
            })
            .catch((e) => (error = e));
          expect(error).toBeDefined();
          expect(error.message).toBe('Failed to sendTelegram');
          expect(error.cause).toStrictEqual(
            new Error(`No Workerpool order found for the desired price`)
          );
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });
    describe('when using the user set the workerpoolMaxPrice', () => {
      it(
        `should throw an error if the user can't pay with its account`,
        async () => {
          let error!: Web3TelegramWorkflowError;
          await web3telegram
            .sendTelegram({
              telegramContent: 'e2e telegram content for test',
              protectedData: validProtectedData.address,
              workerpoolAddress: paidWorkerpoolAddress,
              workerpoolMaxPrice: prodWorkerpoolPublicPrice,
            })
            .catch((e) => (error = e));
          expect(error).toBeInstanceOf(Web3TelegramWorkflowError);
          expect(error.message).toBe('Failed to sendTelegram');
          expect(error.cause).toStrictEqual(
            new Error(
              `Cost per task (${prodWorkerpoolPublicPrice}) is greater than requester account stake (0). Orders can't be matched. If you are the requester, you should deposit to top up your account`
            )
          );
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
      it(
        'should successfully send telegram message when the user can pay with its account',
        async () => {
          await ensureSufficientStake(
            consumerIExecInstance,
            prodWorkerpoolPublicPrice
          );
          const sendTelegramResponse = await web3telegram.sendTelegram({
            telegramContent: 'e2e telegram content for test',
            protectedData: validProtectedData.address,
            workerpoolAddress: paidWorkerpoolAddress,
            workerpoolMaxPrice: prodWorkerpoolPublicPrice,
          });
          expect(sendTelegramResponse).toStrictEqual({
            dealId: expect.any(String),
            taskId: expect.any(String),
          });
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });
  });

  it(
    'should fail if the protected data is not valid',
    async () => {
      await expect(
        web3telegram.sendTelegram({
          telegramContent: 'e2e telegram content for test',
          protectedData: invalidProtectedData.address,
          workerpoolAddress: learnProdWorkerpoolAddress,
        })
      ).rejects.toThrow('Failed to sendTelegram');

      let error: Web3TelegramWorkflowError | undefined;
      try {
        await web3telegram.sendTelegram({
          telegramContent: 'e2e telegram content for test',
          protectedData: invalidProtectedData.address,
          workerpoolAddress: learnProdWorkerpoolAddress,
        });
      } catch (err) {
        error = err as Web3TelegramWorkflowError;
      }
      expect(error).toBeInstanceOf(Web3TelegramWorkflowError);
      expect(error?.message).toBe('Failed to sendTelegram');
      expect(error?.cause).toBeInstanceOf(Error);
      expect((error?.cause as Error).message).toBe(
        'This protected data does not contain "telegram_chatId:string" in its schema.'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should fail if there is no Dataset order found',
    async () => {
      const protectedData = await dataProtector.protectData({
        data: { telegram_chatId: '12345' },
        name: 'test do not use',
      });
      await waitSubgraphIndexing();

      await expect(
        web3telegram.sendTelegram({
          telegramContent: 'e2e telegram content for test',
          protectedData: protectedData.address,
          workerpoolAddress: learnProdWorkerpoolAddress,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to sendTelegram',
          errorCause: new Error('No Dataset order found for the desired price'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000
  );

  it(
    'should throw a protocol error id a service is not available',
    async () => {
      const [ethProvider, defaultOptions] = getTestConfig(
        providerWallet.privateKey
      );

      const options = {
        ...defaultOptions,
        iexecOptions: {
          ...defaultOptions.iexecOptions,
          iexecGatewayURL: 'https://test',
        },
      };

      const invalidWeb3telegram = new IExecWeb3telegram(ethProvider, options);
      let error: Web3TelegramWorkflowError | undefined;

      try {
        await invalidWeb3telegram.sendTelegram({
          protectedData: validProtectedData.address,
          workerpoolAddress: learnProdWorkerpoolAddress,
          telegramContent: 'e2e telegram content for test',
        });
      } catch (err) {
        error = err as Web3TelegramWorkflowError;
      }

      expect(error).toBeInstanceOf(Web3TelegramWorkflowError);
      expect(error?.message).toBe(
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
      );
      expect(error?.isProtocolError).toBe(true);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram when using a free prod workerpool',
    async () => {
      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent: 'e2e telegram content for test',
        protectedData: validProtectedData.address,
        workerpoolAddress: learnProdWorkerpoolAddress,
      });
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram with granted access to whitelist address',
    async () => {
      const protectedDataForWhitelist = await dataProtector.protectData({
        data: { telegram_chatId: '1461320872' },
        name: 'test do not use',
      });
      await waitSubgraphIndexing();
      await dataProtector.grantAccess({
        authorizedApp: TEST_WEB3TELEGRAM_DAPP_ADDRESS,
        protectedData: protectedDataForWhitelist.address,
        authorizedUser: consumerWallet.address,
        numberOfAccess: 1000,
      });

      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent: 'e2e telegram content for test',
        protectedData: protectedDataForWhitelist.address,
        workerpoolAddress: learnProdWorkerpoolAddress,
      });
      expect('taskId' in sendTelegramResponse).toBe(true);
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram with content type html',
    async () => {
      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent:
          '<html><body><h1>Test html</h1> <p>test paragraph </p></body></html>',
        protectedData: validProtectedData.address,
        workerpoolAddress: learnProdWorkerpoolAddress,
      });
      expect('taskId' in sendTelegramResponse).toBe(true);
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram with a valid senderName',
    async () => {
      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent: 'e2e telegram content for test',
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
        workerpoolAddress: learnProdWorkerpoolAddress,
      });
      expect(sendTelegramResponse).toBeDefined();
      expect('taskId' in sendTelegramResponse).toBe(true);
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram with message content size < 512 kilo-bytes',
    async () => {
      const desiredSizeInBytes = 500000;
      const characterToRepeat = 'A';
      const LARGE_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent: LARGE_CONTENT,
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
        workerpoolAddress: learnProdWorkerpoolAddress,
      });
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send telegram with a valid label',
    async () => {
      const sendTelegramResponse = await web3telegram.sendTelegram({
        telegramContent: 'e2e telegram content for test',
        protectedData: validProtectedData.address,
        workerpoolAddress: learnProdWorkerpoolAddress,
        label: 'ID1234678',
      });
      expect(sendTelegramResponse).toStrictEqual({
        dealId: expect.any(String),
        taskId: expect.any(String),
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
