import { jest } from '@jest/globals';

await jest.unstable_mockModule('node-telegram-bot-api', () => ({
  default: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({}),
  })),
}));

const TelegramBot = (await import('node-telegram-bot-api')).default;

const sendTelegram = (await import('../../src/telegramService.js')).default;

describe('sendTelegram', () => {
  const chatId = '123456';
  const botToken = '1234567890:AAErrIg-wT2ggOOgHusks6f9Qz1wBSoqTJg';
  const message = 'This is a test message.';
  const senderName = 'iExec web3telegram';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a Telegram message successfully', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    const response = await sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });

    expect(TelegramBot).toHaveBeenCalledWith(botToken);

    expect(mockSendMessage).toHaveBeenCalledWith(
      chatId,
      `Message from: ${senderName}\n${message}`
    );

    expect(response).toEqual({
      message: 'Your telegram message has been sent successfully.',
      status: 200,
    });
  });

  it('handles errors when sending a Telegram message', async () => {
    const mockSendMessage = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    console.error = jest.fn();

    const response = await sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });

    // ✅ Fix: Only check `botToken` in the expectation
    expect(TelegramBot).toHaveBeenCalledWith(botToken);

    expect(mockSendMessage).toHaveBeenCalledWith(
      chatId,
      `Message from: ${senderName}\n${message}`
    );

    expect(console.error).toHaveBeenCalledWith(
      'Failed to send Telegram message.'
    );

    expect(response).toEqual({
      message: 'Failed to send Telegram message.',
      status: 500,
    });
  });

  it('throws an error when chatId is missing', async () => {
    await expect(
      sendTelegram({ chatId: undefined, message, botToken, senderName })
    ).rejects.toThrowError('Chat ID is required');
  });

  it('throws an error when message is missing', async () => {
    await expect(
      sendTelegram({ chatId, message: undefined, botToken, senderName })
    ).rejects.toThrowError('Message content is required');
  });

  it('throws an error when botToken is missing', async () => {
    await expect(
      sendTelegram({ chatId, message, botToken: undefined, senderName })
    ).rejects.toThrowError('Bot token is required');
  });

  it('should not throw an error when sender name is undefined', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    await expect(
      sendTelegram({ chatId, message, botToken })
    ).resolves.not.toThrow();
  });

  it('should not throw an error when sender name is undefined', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    await expect(
      sendTelegram({ chatId, message, botToken, senderName: undefined })
    ).resolves.not.toThrow();
  });
});
