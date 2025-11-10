import fsPromises from 'fs/promises';
import path from 'path';
import start from '../../src/executeTask';

export async function readOutputs(outputDir) {
  const [result, computed] = await Promise.all([
    fsPromises
      .readFile(path.join(outputDir, 'result.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => null),
    fsPromises
      .readFile(path.join(outputDir, 'computed.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => null),
  ]);
  return {
    result,
    computed,
  };
}

export async function cleanOutputs(outputDir) {
  await fsPromises.rm(outputDir, { recursive: true }).catch(() => {});
  await fsPromises.mkdir(outputDir, { recursive: true });
}

describe('sendTelegram', () => {
  beforeEach(async () => {
    // worker env setup
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    // clean IEXEC_OUT
    await cleanOutputs(process.env.IEXEC_OUT);
  });

  beforeEach(() => {
    // protected data setup
    process.env.IEXEC_DATASET_FILENAME = 'data-chatId.zip';
    // developer secret setup
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      TELEGRAM_BOT_TOKEN: '7045386731:AAGSmPQQ_t2Po5eDob7rUEWEZ25W-s2t9fg',
    });
    // requester secret setup
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'e2e test',
    });
  });

  it('should output an error if developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = '';
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error: 'Failed to parse the developer secret',
    });
  });

  it('should output an error if TELEGRAM_BOT_TOKEN in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({});
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error: 'App secret error: "TELEGRAM_BOT_TOKEN" is required',
    });
  });

  it('should output an error if telegramContentEncryptionKey is empty', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentEncryptionKey: '',
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      senderName: 'sender test name',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error:
        'Requester secret error: "telegramContentEncryptionKey" is not allowed to be empty',
    });
  });

  it('should output an error if telegramContentEncryptionKey is not base64', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey: 'notabase64',
      senderName: 'sender test name',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error:
        'Requester secret error: "telegramContentEncryptionKey" must be a valid base64 string',
    });
  });

  it('should output an error if telegramContentMultiAddr is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'sender test name',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error: 'Requester secret error: "telegramContentMultiAddr" is required',
    });
  });

  it('should output an error if telegramContentMultiAddr is not a valid multiAddr', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr: 'notamultiaddr',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'sender test name',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error:
        'Requester secret error: "telegramContentMultiAddr" must be a multiAddr',
    });
  });

  it('should output an error if IEXEC_REQUESTER_SECRET_1 is not a JSON', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = '_';
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error: 'Failed to parse requester secret',
    });
  });

  it('should output an error if senderName is too long', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: 'A very long sender tag may be flagged as spam',
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error:
        'Requester secret error: "senderName" length must be less than or equal to 20 characters long',
    });
  });

  it('should output an error if senderName is empty', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: '',
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      success: false,
      error: 'Requester secret error: "senderName" is not allowed to be empty',
    });
  });

  it('should send the telegram if senderName is undefined and set the default senderName to "iExec web3telegram"', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
    });
    await start();
    const { result } = await readOutputs(process.env.IEXEC_OUT);
    expect(result).toStrictEqual({
      protectedData: 'data-chatId.zip',
      success: true,
    });
  });

  it('should output an error if telegram service fails', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      TELEGRAM_BOT_TOKEN: 'wrongtoken',
    });
    const { IEXEC_OUT } = process.env;
    await start();
    const { result, computed } = await readOutputs(IEXEC_OUT);
    expect(result).toStrictEqual({
      protectedData: 'data-chatId.zip',
      success: false,
      error:
        'Failed to send Telegram message, bot API answered with status: 404',
    });
    expect(computed).toStrictEqual({
      'deterministic-output-path': `${IEXEC_OUT}/result.json`,
    });
  });

  it('should send a telegram message successfully', async () => {
    await expect(start()).resolves.toBeUndefined();

    const { IEXEC_OUT } = process.env;
    const { result, computed } = await readOutputs(IEXEC_OUT);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(computed).toStrictEqual({
      'deterministic-output-path': `${IEXEC_OUT}/result.json`,
    });
  });

  describe('Bulk Processing', () => {
    beforeEach(() => {
      // Setup bulk processing environment
      process.env.IEXEC_BULK_SLICE_SIZE = '2';
      process.env.IEXEC_DATASET_1_FILENAME = 'data-chatId.zip';
      process.env.IEXEC_DATASET_2_FILENAME = 'data-chatId.zip';
    });

    it('should process multiple datasets successfully', async () => {
      await expect(start()).resolves.toBeUndefined();
      const { IEXEC_OUT } = process.env;
      const { computed, result } = await readOutputs(IEXEC_OUT);
      // Check result.json (main output file)
      expect(result).toStrictEqual({
        success: true,
        totalCount: 2,
        successCount: 2,
        errorCount: 0,
        results: [
          {
            index: 1,
            protectedData: 'data-chatId.zip',
            success: true,
          },
          {
            index: 2,
            protectedData: 'data-chatId.zip',
            success: true,
          },
        ],
      });
      // Check computed.json
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${IEXEC_OUT}/result.json`,
      });
    });

    it('should handle bulk processing with mixed results and output an error', async () => {
      process.env.IEXEC_DATASET_1_FILENAME = 'data-chatId.zip'; // Valid dataset
      process.env.IEXEC_DATASET_2_FILENAME = 'invalid-data.zip'; // Invalid dataset

      await expect(start()).resolves.toBeUndefined();
      const { IEXEC_OUT } = process.env;
      const { computed, result } = await readOutputs(IEXEC_OUT);

      // Check result.json (main output file)
      expect(result).toStrictEqual({
        error: 'Partial failure',
        success: false,
        totalCount: 2,
        successCount: 1,
        errorCount: 1,
        results: [
          {
            index: 1,
            protectedData: 'data-chatId.zip',
            success: true,
          },
          {
            index: 2,
            protectedData: 'invalid-data.zip',
            success: false,
            error:
              'Failed to parse ProtectedData 2: Failed to load protected data',
          },
        ],
      });

      // Check computed.json
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${IEXEC_OUT}/result.json`,
      });
    });
  });
});
