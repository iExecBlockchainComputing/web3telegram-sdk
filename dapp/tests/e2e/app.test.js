import { promises as fsPromises } from 'fs';
import path from 'path';
import start from '../../src/executeTask';

describe('sendTelegram', () => {
  beforeEach(async () => {
    // worker env setup
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    // clean IEXEC_OUT
    await fsPromises
      .rm(process.env.IEXEC_OUT, { recursive: true })
      .catch(() => {});
    await fsPromises.mkdir(process.env.IEXEC_OUT, { recursive: true });
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

  it('should fail if developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = '';
    await expect(start()).rejects.toThrow(
      new Error('Failed to parse the developer secret')
    );
  });

  it('should fail if TELEGRAM_BOT_TOKEN in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({});
    await expect(start()).rejects.toThrow(
      new Error('App secret error: "TELEGRAM_BOT_TOKEN" is required')
    );
  });

  it('should fail if telegramContentEncryptionKey is empty', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentEncryptionKey: '',
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      senderName: 'sender test name',
    });
    await expect(start()).rejects.toThrow(
      new Error(
        'Requester secret error: "telegramContentEncryptionKey" is not allowed to be empty'
      )
    );
  });

  it('should fail if telegramContentEncryptionKey is not base64', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey: 'notabase64',
      senderName: 'sender test name',
    });
    await expect(start()).rejects.toThrow(
      new Error(
        'Requester secret error: "telegramContentEncryptionKey" must be a valid base64 string'
      )
    );
  });

  it('should fail if telegramContentMultiAddr is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'sender test name',
    });
    await expect(start()).rejects.toThrow(
      new Error(
        'Requester secret error: "telegramContentMultiAddr" is required'
      )
    );
  });

  it('should fail if telegramContentMultiAddr is not a valid multiAddr', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr: 'notamultiaddr',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'sender test name',
    });
    await expect(start()).rejects.toThrow(
      new Error(
        'Requester secret error: "telegramContentMultiAddr" must be a multiAddr'
      )
    );
  });

  it('should fail if IEXEC_REQUESTER_SECRET_1 is not a JSON', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = '_';
    await expect(start()).rejects.toThrow(
      new Error('Failed to parse requester secret')
    );
  });

  it('should fail if senderName is too long', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: 'A very long sender tag may be flagged as spam',
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
    });
    await expect(start()).rejects.toThrow(
      new Error(
        'Requester secret error: "senderName" length must be less than or equal to 20 characters long'
      )
    );
  });

  it('should send the telegram if senderName is undefined and set the default senderName to "iExec web3telegram"', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
    });
    await expect(start()).resolves.not.toThrow();
  });

  it('should handle telegram service failure gracefully and write error in output', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      TELEGRAM_BOT_TOKEN: 'wrongtoken',
    });
    await expect(start()).resolves.toBeUndefined();

    const { IEXEC_OUT } = process.env;
    const resultTxt = await fsPromises.readFile(
      path.join(IEXEC_OUT, 'result.txt'),
      'utf-8'
    );
    const computedJson = await fsPromises.readFile(
      path.join(IEXEC_OUT, 'computed.json'),
      'utf-8'
    );

    expect(JSON.parse(resultTxt)).toStrictEqual({
      message: 'Failed to send Telegram message.',
      status: 500,
    });
    expect(JSON.parse(computedJson)).toStrictEqual({
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
    });
  });

  it('should send a telegram message successfully', async () => {
    await expect(start()).resolves.toBeUndefined();

    const { IEXEC_OUT } = process.env;
    const resultTxt = await fsPromises.readFile(
      path.join(IEXEC_OUT, 'result.txt'),
      'utf-8'
    );
    const computedJson = await fsPromises.readFile(
      path.join(IEXEC_OUT, 'computed.json'),
      'utf-8'
    );

    expect(JSON.parse(resultTxt)).toStrictEqual({
      message: 'Your telegram message has been sent successfully.',
      status: 200,
    });
    expect(JSON.parse(computedJson)).toStrictEqual({
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
    });
  });
});
