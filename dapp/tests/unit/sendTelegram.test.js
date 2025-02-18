const fs = require('fs').promises;
const sendTelegram = require('../../src/telegramService');
const {
  downloadEncryptedContent,
  decryptContent,
} = require('../../src/decryptContent');
const start = require('../../src/executeTask');

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
  },
}));

jest.mock('@iexec/dataprotector-deserializer', () => ({
  IExecDataProtectorDeserializer: jest.fn().mockImplementation(() => ({
    getValue: jest.fn().mockResolvedValue('mock-chat-id'),
  })),
}));

jest.mock('../../src/telegramService', () =>
  jest.fn().mockResolvedValue({
    message: 'Your telegram message has been sent successfully.',
    status: 200,
  })
);

jest.mock('../../src/validation', () => ({
  validateWorkerEnv: jest.fn().mockReturnValue({ IEXEC_OUT: '/mock/output' }),
  validateAppSecret: jest
    .fn()
    .mockReturnValue({ TELEGRAM_BOT_TOKEN: 'fake-bot-token' }),
  validateRequesterSecret: jest.fn().mockReturnValue({
    senderName: 'TestUser',
    telegramContentMultiAddr: 'mock-multiaddr',
    telegramContentEncryptionKey: 'mock-encryption-key',
  }),
  validateProtectedData: jest.fn().mockReturnValue({ chatId: 'mock-chat-id' }),
}));

jest.mock('../../src/decryptContent', () => ({
  downloadEncryptedContent: jest.fn(),
  decryptContent: jest.fn(),
}));

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

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/output/result.txt',
      JSON.stringify(
        {
          message: 'Your telegram message has been sent successfully.',
          status: 200,
        },
        null,
        2
      )
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/output/computed.json',
      JSON.stringify({ 'deterministic-output-path': '/mock/output/result.txt' })
    );
  });

  test('should throw an error when developer secret is invalid', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = 'invalid-json';

    await expect(start()).rejects.toThrow(
      'Failed to parse the developer secret'
    );
  });

  test('should throw an error when requester secret is invalid', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = 'invalid-json';

    await expect(start()).rejects.toThrow('Failed to parse requester secret');
  });

  test('should fail when downloadEncryptedContent fails', async () => {
    downloadEncryptedContent.mockRejectedValue(new Error('Download error'));

    await expect(start()).rejects.toThrow('Download error');
  });

  test('should fail when decryptContent fails', async () => {
    decryptContent.mockImplementation(() => {
      throw new Error('Decryption failed');
    });

    await expect(start()).rejects.toThrow('Decryption failed');
  });

  test('should exit when writeTaskOutput fails', async () => {
    fs.writeFile.mockRejectedValueOnce(new Error('Write error'));

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await start();

    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });

  test('should fail when sendTelegram fails', async () => {
    sendTelegram.mockRejectedValue(new Error('Telegram API Error'));

    await expect(start()).rejects.toThrow('Telegram API Error');
  });
});
