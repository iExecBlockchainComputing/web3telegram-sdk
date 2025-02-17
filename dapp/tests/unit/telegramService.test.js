const TelegramBot = require('node-telegram-bot-api');
const sendTelegram = require('../../src/telegramService');

jest.mock('node-telegram-bot-api');

describe('sendTelegram', () => {
  const chatId = '123456';
  const botToken = '1234567890:AAErrIg-wT2ggOOgHusks6f9Qz1wBSoqTJg';
  const message = 'This is a test message.';
  const senderName = 'iExec web3telegram';

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
    const params = {
      chatId: undefined,
      message,
      botToken,
      senderName,
    };

    await expect(sendTelegram(params)).rejects.toThrowError(
      'Chat ID is required'
    );
  });

  it('throws an error when message is missing', async () => {
    const params = {
      chatId,
      message: undefined,
      botToken,
      senderName,
    };

    await expect(sendTelegram(params)).rejects.toThrowError(
      'Message content is required'
    );
  });

  it('throws an error when botToken is missing', async () => {
    const params = {
      chatId,
      message,
      botToken: undefined,
      senderName,
    };

    await expect(sendTelegram(params)).rejects.toThrow('Bot token is required');
  });

  it('should not throws an error when sender name is undefined', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    const params = {
      chatId,
      message,
      botToken,
    };
    await expect(sendTelegram(params)).resolves.not.toThrow();
  });

  it('should not throws an error when sender name is undefined', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({});
    TelegramBot.mockImplementation(() => ({
      sendMessage: mockSendMessage,
    }));

    const params = {
      chatId,
      message,
      botToken,
      senderName: undefined,
    };
    await expect(sendTelegram(params)).resolves.not.toThrow();
  });
});
