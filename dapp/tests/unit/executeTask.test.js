/* eslint-disable no-unused-vars */
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/validation.js', () => ({
  validateWorkerEnv: jest.fn().mockReturnValue({
    IEXEC_APP_DEVELOPER_SECRET: {
      TELEGRAM_BOT_TOKEN: 'fake-bot-token',
    },
    IEXEC_REQUESTER_SECRET_1: {
      senderName: 'TestUser',
      telegramContentMultiAddr: 'mock-multiaddr',
      telegramContentEncryptionKey: 'mock-encryption-key',
    },
    IEXEC_OUT: '/mock/output',
  }),
  validateAppSecret: jest
    .fn()
    .mockReturnValue({ TELEGRAM_BOT_TOKEN: 'fake-bot-token' }),
  validateRequesterSecret: jest.fn().mockReturnValue({
    senderName: 'TestUser',
    telegramContentMultiAddr: 'mock-multiaddr',
    telegramContentEncryptionKey: 'mock-encryption-key',
  }),
  validateProtectedData: jest.fn().mockReturnValue({ chatId: 'mock-chat-id' }), // ✅ Fix 1: Ensure `chatId` is returned
}));

jest.unstable_mockModule('../../src/decryptContent.js', () => ({
  downloadEncryptedContent: jest.fn(),
  decryptContent: jest.fn(),
}));

jest.unstable_mockModule('../../src/telegramService.js', () => ({
  default: jest.fn().mockResolvedValue({
    message: 'Your telegram message has been sent successfully.',
    status: 200,
  }),
}));
jest.unstable_mockModule('@iexec/dataprotector-deserializer', () => ({
  IExecDataProtectorDeserializer: jest.fn().mockImplementation(() => ({
    getValue: jest.fn().mockResolvedValue('mock-chat-id'),
  })),
}));
jest.unstable_mockModule('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));
const { downloadEncryptedContent, decryptContent } = await import(
  '../../src/decryptContent'
);
const sendTelegram = (await import('../../src/telegramService')).default;
const { promises: fs } = await import('fs');
const start = (await import('../../src/executeTask')).default;

describe('start function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      IEXEC_APP_DEVELOPER_SECRET: JSON.stringify({
        TELEGRAM_BOT_TOKEN: 'fake-bot-token',
      }),
      IEXEC_REQUESTER_SECRET_1: JSON.stringify({
        senderName: 'TestUser',
        telegramContentMultiAddr: 'mock-multiaddr',
        telegramContentEncryptionKey: 'mock-encryption-key',
      }),
      IEXEC_OUT: '/mock/output',
    };
    downloadEncryptedContent.mockResolvedValue('mock-encrypted-content');
    decryptContent.mockReturnValue('Decrypted message');
  });

  test('should execute successfully and write outputs', async () => {
    await start();

    expect(downloadEncryptedContent).toHaveBeenCalledWith('mock-multiaddr');
    expect(decryptContent).toHaveBeenCalledWith(
      'mock-encrypted-content',
      'mock-encryption-key'
    );
    expect(sendTelegram).toHaveBeenCalledWith({
      chatId: 'mock-chat-id',
      message: 'Decrypted message',
      botToken: 'fake-bot-token',
      senderName: 'TestUser',
    });

    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: true,
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        { 'deterministic-output-path': '/mock/output/result.json' },
        null,
        2
      )
    );
  });

  test('should output an error when developer secret is invalid', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = 'invalid-json';

    await start();
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: false,
          error: 'Failed to parse the developer secret',
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        {
          'deterministic-output-path': '/mock/output/result.json',
        },
        null,
        2
      )
    );
  });

  test('should output an error when requester secret is invalid', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = 'invalid-json';

    await start();
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: false,
          error: 'Failed to parse requester secret',
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        {
          'deterministic-output-path': '/mock/output/result.json',
        },
        null,
        2
      )
    );
  });

  test('should output an error when downloadEncryptedContent fails', async () => {
    downloadEncryptedContent.mockRejectedValue(new Error('Download error'));
    await start();
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: false,
          error: 'Download error',
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        {
          'deterministic-output-path': '/mock/output/result.json',
        },
        null,
        2
      )
    );
  });

  test('should output an error when decryptContent fails', async () => {
    decryptContent.mockImplementation(() => {
      throw new Error('Decryption failed');
    });

    await start();
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: false,
          error: 'Decryption failed',
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        {
          'deterministic-output-path': '/mock/output/result.json',
        },
        null,
        2
      )
    );
  });

  test('should output an error when sendTelegram fails', async () => {
    sendTelegram.mockImplementation(() => {
      throw new Error('Send failed');
    });

    await start();
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      1,
      '/mock/output/result.json',
      JSON.stringify(
        {
          success: false,
          error: 'Send failed',
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenNthCalledWith(
      2,
      '/mock/output/computed.json',
      JSON.stringify(
        {
          'deterministic-output-path': '/mock/output/result.json',
        },
        null,
        2
      )
    );
  });

  test('should throw when writeTaskOutput fails', async () => {
    fs.writeFile.mockRejectedValueOnce(new Error('Write error')); // ✅ Fix 2: Ensure mockRejectedValueOnce is available
    await expect(start()).rejects.toThrow(Error('Write error'));
  });
});
