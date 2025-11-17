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
    jest.useFakeTimers();
    const mockResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        ok: false,
        description: 'Bad Request',
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });

    // Run all timers to completion
    const timerPromise = jest.runAllTimersAsync();

    // Wait for both the timers and the promise to settle
    await Promise.all([
      timerPromise,
      expect(sendPromise).rejects.toThrow(
        'Failed to send Telegram message, bot API answered with status: 400'
      ),
    ]);

    jest.useRealTimers();
  });

  it('handles network errors', async () => {
    jest.useFakeTimers();
    global.fetch.mockRejectedValue(new Error('Network error'));

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
      maxRetries: 0, // No retries for this test
    });

    // Run all timers to completion
    const timerPromise = jest.runAllTimersAsync();

    // Wait for both the timers and the promise to settle
    await Promise.all([
      timerPromise,
      expect(sendPromise).rejects.toThrow('Failed to reach Telegram bot API'),
    ]);

    jest.useRealTimers();
  });

  it('should not throw an error when sender name is undefined', async () => {
    jest.useFakeTimers();
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const sendPromise = sendTelegram({ chatId, message, botToken });

    // Fast-forward time by 1 second to skip the delay
    await jest.advanceTimersByTimeAsync(1000);

    await expect(sendPromise).resolves.not.toThrow();
    jest.useRealTimers();
  });

  it('should wait 1 second before each API call', async () => {
    jest.useFakeTimers();
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });

    // Verify fetch is not called before 1 second
    expect(global.fetch).not.toHaveBeenCalled();

    // Fast-forward time by 1 second to skip the delay
    await jest.advanceTimersByTimeAsync(1000);

    // Wait for the promise to resolve
    await sendPromise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('should retry on 429 error with Retry-After header and succeed', async () => {
    jest.useFakeTimers();
    const mockHeaders = new Map();
    mockHeaders.set('Retry-After', '2');
    const mockHeadersGet = jest.fn((key) => mockHeaders.get(key));

    const failedResponse = {
      ok: false,
      status: 429,
      headers: {
        get: mockHeadersGet,
      },
    };
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };

    global.fetch
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(successResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
    });

    // Fast-forward time: 1s (initial delay) + 2s (Retry-After) + 1s (delay before retry)
    await jest.advanceTimersByTimeAsync(1000); // Initial delay
    await jest.advanceTimersByTimeAsync(2000); // Retry-After delay
    await jest.advanceTimersByTimeAsync(1000); // Delay before retry

    await expect(sendPromise).resolves.not.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('should retry on 429 error with exponential backoff when no Retry-After header and succeed', async () => {
    jest.useFakeTimers();
    const mockHeaders = new Map();
    // eslint-disable-next-line sonarjs/no-empty-collection
    const mockHeadersGet = jest.fn((key) => mockHeaders.get(key));

    const failedResponse = {
      ok: false,
      status: 429,
      headers: {
        get: mockHeadersGet,
      },
    };
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };

    global.fetch
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(successResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
      initialDelay: 100,
    });

    // Fast-forward time: 1s (initial delay) + 100ms (exponential backoff) + 1s (delay before retry)
    await jest.advanceTimersByTimeAsync(1000); // Initial delay
    await jest.advanceTimersByTimeAsync(100); // Exponential backoff (100ms for attempt 0)
    await jest.advanceTimersByTimeAsync(1000); // Delay before retry

    await expect(sendPromise).resolves.not.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('should throw error after max retries on 429 error', async () => {
    jest.useFakeTimers();
    const mockHeaders = new Map();
    // eslint-disable-next-line sonarjs/no-empty-collection
    const mockHeadersGet = jest.fn((key) => mockHeaders.get(key));

    const failedResponse = {
      ok: false,
      status: 429,
      headers: {
        get: mockHeadersGet,
      },
    };

    global.fetch.mockResolvedValue(failedResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
      maxRetries: 2,
      initialDelay: 10,
    });

    // Run all timers to completion
    const timerPromise = jest.runAllTimersAsync();

    // Wait for both the timers and the promise to settle
    await Promise.all([
      timerPromise,
      expect(sendPromise).rejects.toThrow(
        'Failed to send Telegram message: Rate limit exceeded after 3 attempts'
      ),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    jest.useRealTimers();
  });

  it('should retry on network errors with exponential backoff and succeed', async () => {
    jest.useFakeTimers();
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };

    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(successResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
      initialDelay: 100,
    });

    // Run all timers to completion
    const timerPromise = jest.runAllTimersAsync();

    // Wait for both the timers and the promise to settle
    await Promise.all([
      timerPromise,
      expect(sendPromise).resolves.not.toThrow(),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('should apply 1 second delay before each retry attempt', async () => {
    jest.useFakeTimers();
    const mockHeaders = new Map();
    // eslint-disable-next-line sonarjs/no-empty-collection
    const mockHeadersGet = jest.fn((key) => mockHeaders.get(key));

    const failedResponse = {
      ok: false,
      status: 429,
      headers: {
        get: mockHeadersGet,
      },
    };
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
    };

    global.fetch
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(successResponse);

    const sendPromise = sendTelegram({
      chatId,
      message,
      botToken,
      senderName,
      initialDelay: 100,
    });

    // Run all timers to completion
    const timerPromise = jest.runAllTimersAsync();

    // Wait for both the timers and the promise to settle
    await Promise.all([
      timerPromise,
      expect(sendPromise).resolves.not.toThrow(),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });
});
