async function sendTelegram({
  chatId,
  message,
  botToken,
  senderName = 'Web3Telegram Dapp',
  maxRetries = 10,
  initialDelay = 1000,
}) {
  const messageToSend = `Message from: ${senderName}\n${message}`;

  const sendMessage = async () => {
    // wait 1 second before each call to avoid rate limit
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageToSend,
        parse_mode: 'HTML',
      }),
    });
  };

  // retry logic with exponential backoff for handling rate limits (429) and network errors
  // eslint-disable-next-line no-plusplus
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await sendMessage();

      if (response.ok) {
        return;
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : initialDelay * 2 ** attempt;

        if (attempt < maxRetries) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
          // eslint-disable-next-line no-continue
          continue;
        }

        throw new Error(
          `Failed to send Telegram message: Rate limit exceeded after ${
            maxRetries + 1
          } attempts`
        );
      }

      // other HTTP errors - throw directly, no retry
      throw new Error(
        `Failed to send Telegram message, bot API answered with status: ${response.status}`
      );
    } catch (error) {
      // if it's an HTTP error (404, 400, etc.) or rate limit error, re-throw immediately
      if (
        error.message.includes('Rate limit') ||
        error.message.includes('Failed to send')
      ) {
        throw error;
      }

      // network errors - retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = initialDelay * 2 ** attempt;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
        // eslint-disable-next-line no-continue
        continue;
      }

      // max retries reached for network errors
      throw new Error('Failed to reach Telegram bot API');
    }
  }
}

export default sendTelegram;
