async function sendTelegram({
  chatId,
  message,
  botToken,
  senderName = 'Web3Telegram Dapp',
}) {
  if (!botToken || botToken.trim() === '')
    throw new Error('Bot token is required');
  if (!chatId || chatId.trim() === '') throw new Error('Chat ID is required');
  if (!message || message.trim() === '')
    throw new Error('Message content is required');

  const messageToSend = `Message from: ${senderName}\n${message}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageToSend,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      console.error('Telegram API Error');
      return {
        message: 'Failed to send Telegram message.',
        status: response.status,
      };
    }

    console.log('Message successfully sent by Telegram bot.');
    return {
      message: 'Your telegram message has been sent successfully.',
      status: 200,
    };
  } catch (error) {
    console.error('Failed to send Telegram message');
    return {
      message: 'Failed to send Telegram message.',
      status: 500,
    };
  }
}

export default sendTelegram;
