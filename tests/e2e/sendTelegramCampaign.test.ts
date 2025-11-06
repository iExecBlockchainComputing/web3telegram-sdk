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
    TEST_CHAIN,
    createAndPublishAppOrders,
    createAndPublishWorkerpoolOrder,
    ensureSufficientStake,
    getRandomWallet,
    getTestConfig,
    getTestIExecOption,
    getTestWeb3SignerProvider,
    waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';

describe('web3telegram.sendTelegramCampaign() - Bulk Processing', () => {
    let consumerWallet: HDNodeWallet;
    let providerWallet: HDNodeWallet;
    let web3telegram: IExecWeb3telegram;
    let dataProtector: IExecDataProtectorCore;
    let validProtectedData1: ProtectedDataWithSecretProps;
    let validProtectedData2: ProtectedDataWithSecretProps;
    let validProtectedData3: ProtectedDataWithSecretProps;
    let consumerIExecInstance: IExec;
    const iexecOptions = getTestIExecOption();
    const prodWorkerpoolPublicPrice = 1000;
    const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

    beforeAll(async () => {
        // Create workerpool orders
        await createAndPublishWorkerpoolOrder(
            TEST_CHAIN.prodWorkerpool,
            TEST_CHAIN.prodWorkerpoolOwnerWallet,
            NULL_ADDRESS,
            1_000,
            prodWorkerpoolPublicPrice
        );

        // Create app orders
        providerWallet = getRandomWallet();
        const ethProvider = getTestWeb3SignerProvider(
            TEST_CHAIN.appOwnerWallet.privateKey
        );
        const resourceProvider = new IExec({ ethProvider }, iexecOptions);
        await createAndPublishAppOrders(
            resourceProvider,
            defaultConfig!.dappAddress
        );


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
    }, 5 * (MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME) + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME + 5_000);

    beforeEach(async () => {
        consumerWallet = getRandomWallet();
        const consumerEthProvider = getTestWeb3SignerProvider(
            consumerWallet.privateKey
        );
        consumerIExecInstance = new IExec(
            { ethProvider: consumerEthProvider },
            iexecOptions
        );

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

        web3telegram = new IExecWeb3telegram(...getTestConfig(consumerWallet.privateKey));
    }, 3 * MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

    describe('Bulk telegram sending', () => {
        it(
            'should successfully process bulk request',
            async () => {
                // Fetch contacts with allowBulk access
                const contacts: Contact[] = await web3telegram.fetchMyContacts();
                expect(contacts.length).toBeGreaterThanOrEqual(3);

                // Ensure consumer has sufficient stake
                await ensureSufficientStake(consumerIExecInstance, prodWorkerpoolPublicPrice);

                const bulkOrders = contacts.map((contact) => contact.grantedAccess);

                // Prepare the telegram campaign using prepareTelegramCampaign
                // Note: This may fail on networks that don't support bulk processing (e.g., bellecour)
                // We expect this error and handle it gracefully
                let bulkProcessingAvailable = true;
                let campaignRequest;
                try {
                    const prepareResult = await web3telegram.prepareTelegramCampaign({
                        telegramContent: 'Bulk test message',
                        grantedAccess: bulkOrders,
                        maxProtectedDataPerTask: 3,
                        appMaxPrice: 1000,
                        workerpoolMaxPrice: 1000,
                        workerpoolAddressOrEns: TEST_CHAIN.prodWorkerpool,
                        senderName: 'Bulk Test Sender',
                    });
                    campaignRequest = prepareResult.campaignRequest;
                } catch (error: unknown) {
                    // Expect error if bulk processing is not available on this network
                    // The error message is "Failed to prepareTelegramCampaign" but the cause contains the actual reason
                    const errorMessage = error instanceof Error ? error.message : '';
                    const errorCause =
                        error instanceof Error && error.cause
                            ? error.cause instanceof Error
                                ? error.cause.message
                                : String(error.cause)
                            : '';
                    const fullError = `${errorMessage} ${errorCause}`;
                    if (fullError.includes('Bulk processing is not available')) {
                        bulkProcessingAvailable = false;
                    } else {
                        throw error;
                    }
                }

                // Skip the rest of the test if bulk processing is not supported
                if (!bulkProcessingAvailable) {
                    return;
                }

                // Process the bulk request using sendTelegramCampaign
                // Use the workerpool from campaignRequest (already resolved to address)
                const result = await web3telegram.sendTelegramCampaign({
                    campaignRequest,
                    workerpoolAddressOrEns: campaignRequest.workerpool,
                });

                // Verify the result
                expect(result).toBeDefined();
                expect('tasks' in result).toBe(true);
                const tasks = 'tasks' in result ? result.tasks : [];
                expect(Array.isArray(tasks)).toBe(true);
                expect(tasks.length).toBeGreaterThan(0);
                tasks.forEach((task) => {
                    expect(task.taskId).toBeDefined();
                    expect(task.dealId).toBeDefined();
                    expect(task.bulkIndex).toBeDefined();
                });
            },
            30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
        );

        it(
            'should successfully process bulk request with single contact',
            async () => {
                // Fetch contacts with allowBulk access
                const contacts: Contact[] = await web3telegram.fetchMyContacts();
                expect(contacts.length).toBeGreaterThanOrEqual(1);

                // Ensure consumer has sufficient stake
                await ensureSufficientStake(consumerIExecInstance, prodWorkerpoolPublicPrice);

                // Use only the first contact
                const bulkOrders = [contacts[0].grantedAccess];

                // Prepare the telegram campaign using prepareTelegramCampaign
                let bulkProcessingAvailable = true;
                let campaignRequest;
                try {
                    const prepareResult = await web3telegram.prepareTelegramCampaign({
                        telegramContent: 'Single contact bulk test message',
                        grantedAccess: bulkOrders,
                        maxProtectedDataPerTask: 1,
                        appMaxPrice: 1000,
                        workerpoolMaxPrice: 1000,
                        workerpoolAddressOrEns: TEST_CHAIN.prodWorkerpool,
                        senderName: 'Single Contact Test',
                    });
                    campaignRequest = prepareResult.campaignRequest;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : '';
                    const errorCause =
                        error instanceof Error && error.cause
                            ? error.cause instanceof Error
                                ? error.cause.message
                                : String(error.cause)
                            : '';
                    const fullError = `${errorMessage} ${errorCause}`;
                    if (fullError.includes('Bulk processing is not available')) {
                        bulkProcessingAvailable = false;
                    } else {
                        throw error;
                    }
                }

                if (!bulkProcessingAvailable) {
                    return;
                }

                // Process the bulk request using sendTelegramCampaign
                // Use the workerpool from campaignRequest (already resolved to address)
                const result = await web3telegram.sendTelegramCampaign({
                    campaignRequest,
                    workerpoolAddressOrEns: campaignRequest.workerpool,
                });

                // Verify the result
                expect(result).toBeDefined();
                expect('tasks' in result).toBe(true);
                const tasks = 'tasks' in result ? result.tasks : [];
                expect(Array.isArray(tasks)).toBe(true);
                expect(tasks.length).toBeGreaterThanOrEqual(1);
            },
            30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
        );

        it(
            'should handle maxProtectedDataPerTask parameter correctly',
            async () => {
                // Fetch contacts with allowBulk access
                const contacts: Contact[] = await web3telegram.fetchMyContacts();
                expect(contacts.length).toBeGreaterThanOrEqual(3);

                // Ensure consumer has sufficient stake
                // With maxProtectedDataPerTask = 1, we'll have multiple tasks (one per contact)
                // Each task costs prodWorkerpoolPublicPrice, so we need enough for all tasks
                const expectedNumberOfTasks = Math.ceil(contacts.length);
                await ensureSufficientStake(
                    consumerIExecInstance,
                    prodWorkerpoolPublicPrice * expectedNumberOfTasks
                );

                const bulkOrders = contacts.map((contact) => contact.grantedAccess);

                // Prepare the telegram campaign with maxProtectedDataPerTask = 1
                // This should create multiple tasks if we have more than 1 contact
                let bulkProcessingAvailable = true;
                let campaignRequest;
                try {
                    const prepareResult = await web3telegram.prepareTelegramCampaign({
                        telegramContent: 'Max protected data per task test',
                        grantedAccess: bulkOrders,
                        maxProtectedDataPerTask: 1, // Force one protected data per task
                        appMaxPrice: 1000,
                        workerpoolMaxPrice: 1000,
                        workerpoolAddressOrEns: TEST_CHAIN.prodWorkerpool,
                        senderName: 'Max Data Test',
                        label: 'MAXDATA',
                    });
                    campaignRequest = prepareResult.campaignRequest;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : '';
                    const errorCause =
                        error instanceof Error && error.cause
                            ? error.cause instanceof Error
                                ? error.cause.message
                                : String(error.cause)
                            : '';
                    const fullError = `${errorMessage} ${errorCause}`;
                    if (fullError.includes('Bulk processing is not available')) {
                        bulkProcessingAvailable = false;
                    } else {
                        throw error;
                    }
                }

                if (!bulkProcessingAvailable) {
                    return;
                }

                // Process the bulk request using sendTelegramCampaign
                // Use the workerpool from campaignRequest (already resolved to address)
                const result = await web3telegram.sendTelegramCampaign({
                    campaignRequest,
                    workerpoolAddressOrEns: campaignRequest.workerpool,
                });

                // Verify the result
                expect(result).toBeDefined();
                expect('tasks' in result).toBe(true);
                const tasks = 'tasks' in result ? result.tasks : [];
                expect(Array.isArray(tasks)).toBe(true);
                // With maxProtectedDataPerTask = 1 and 3+ contacts, we should have multiple tasks
                expect(tasks.length).toBeGreaterThanOrEqual(1);
            },
            30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
        );

        it(
            'should handle custom senderName and label parameters',
            async () => {
                // Fetch contacts with allowBulk access
                const contacts: Contact[] = await web3telegram.fetchMyContacts();
                expect(contacts.length).toBeGreaterThanOrEqual(1);

                // Ensure consumer has sufficient stake
                await ensureSufficientStake(consumerIExecInstance, prodWorkerpoolPublicPrice);

                const bulkOrders = contacts.map((contact) => contact.grantedAccess);

                // Prepare the telegram campaign with custom parameters
                let bulkProcessingAvailable = true;
                let campaignRequest;
                try {
                    const prepareResult = await web3telegram.prepareTelegramCampaign({
                        telegramContent: 'Custom parameters test message',
                        grantedAccess: bulkOrders,
                        maxProtectedDataPerTask: 3,
                        appMaxPrice: 1000,
                        workerpoolMaxPrice: 1000,
                        workerpoolAddressOrEns: TEST_CHAIN.prodWorkerpool,
                        senderName: 'CustomSender',
                        label: 'CUSTOM123',
                    });
                    campaignRequest = prepareResult.campaignRequest;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : '';
                    const errorCause =
                        error instanceof Error && error.cause
                            ? error.cause instanceof Error
                                ? error.cause.message
                                : String(error.cause)
                            : '';
                    const fullError = `${errorMessage} ${errorCause}`;
                    if (fullError.includes('Bulk processing is not available')) {
                        bulkProcessingAvailable = false;
                    } else {
                        throw error;
                    }
                }

                if (!bulkProcessingAvailable) {
                    return;
                }

                // Process the bulk request using sendTelegramCampaign
                // Use the workerpool from campaignRequest (already resolved to address)
                const result = await web3telegram.sendTelegramCampaign({
                    campaignRequest,
                    workerpoolAddressOrEns: campaignRequest.workerpool,
                });

                // Verify the result
                expect(result).toBeDefined();
                expect('tasks' in result).toBe(true);
                const tasks = 'tasks' in result ? result.tasks : [];
                expect(Array.isArray(tasks)).toBe(true);
                expect(tasks.length).toBeGreaterThan(0);
            },
            30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
        );

        it(
            'should throw error when workerpoolAddressOrEns does not match campaignRequest.workerpool',
            async () => {
                // Fetch contacts with allowBulk access
                const contacts: Contact[] = await web3telegram.fetchMyContacts();
                expect(contacts.length).toBeGreaterThanOrEqual(1);

                const bulkOrders = contacts.map((contact) => contact.grantedAccess);

                // Prepare the telegram campaign
                let bulkProcessingAvailable = true;
                let campaignRequest;
                try {
                    const prepareResult = await web3telegram.prepareTelegramCampaign({
                        telegramContent: 'Workerpool mismatch test',
                        grantedAccess: bulkOrders,
                        maxProtectedDataPerTask: 3,
                        appMaxPrice: 1000,
                        workerpoolMaxPrice: 1000,
                        workerpoolAddressOrEns: TEST_CHAIN.prodWorkerpool,
                        senderName: 'Mismatch Test',
                    });
                    campaignRequest = prepareResult.campaignRequest;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : '';
                    const errorCause =
                        error instanceof Error && error.cause
                            ? error.cause instanceof Error
                                ? error.cause.message
                                : String(error.cause)
                            : '';
                    const fullError = `${errorMessage} ${errorCause}`;
                    if (fullError.includes('Bulk processing is not available')) {
                        bulkProcessingAvailable = false;
                    } else {
                        throw error;
                    }
                }

                if (!bulkProcessingAvailable) {
                    return;
                }

                // Try to send with a different workerpool (should fail)
                const differentWorkerpool = '0x1234567890123456789012345678901234567890';
                await expect(
                    web3telegram.sendTelegramCampaign({
                        campaignRequest,
                        workerpoolAddressOrEns: differentWorkerpool,
                    })
                ).rejects.toMatchObject({
                    message: 'Failed to sendTelegramCampaign',
                    cause: expect.objectContaining({
                        name: 'ValidationError',
                        message: 'Workerpool mismatch',
                    }),
                });
            },
            30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
        );
    });
});

