// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

const sendTelegram = (await import('../../src/telegramService')).default;

describe('sendTelegram', () => {
  const chatId = '123456';
  const botToken = '1234567890:AAErrIg-wT2ggOOgHusks6f9Qz1wBSoqTJg';
  const message = 'This is a test message.';
  const senderName = 'iExec web3telegram';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a Telegram message successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };
    global.fetch.mockResolvedValue(mockResponse);
    const response = await sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Message from: ${senderName}\n${message}`,
          parse_mode: 'HTML',
        }),
      }
    );
    expect(response).toBeUndefined();
  });

  it('handles errors when sending a Telegram message', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        ok: false,
        description: 'Bad Request',
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      sendTelegram({
        chatId,
        message,
        botToken,
        senderName,
      })
    ).rejects.toThrow(
      Error(
        'Failed to send Telegram message, bot API answered with status: 400'
      )
    );
  });

  it('handles network errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    await expect(
      sendTelegram({
        chatId,
        message,
        botToken,
        senderName,
      })
    ).rejects.toThrow('Failed to reach Telegram bot API');
  });

  it('should not throw an error when sender name is undefined', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      sendTelegram({ chatId, message, botToken })
    ).resolves.not.toThrow();
  });
});
