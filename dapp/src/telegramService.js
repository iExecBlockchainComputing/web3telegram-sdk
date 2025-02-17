const TelegramBot = require('node-telegram-bot-api');

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

  const bot = new TelegramBot(botToken);

  const messageToSend = `Message from: ${senderName}\n${message}`;

  let error;
  await bot.sendMessage(chatId, messageToSend).catch((e) => {
    error = e;
  });

  if (error) {
    console.error('Failed to send Telegram message.');

    return {
      message: 'Failed to send Telegram message.',
      // TODO: delete this line in production mode to avoid exposing the error message to the user (security risk)
      error: error,
      status: 500,
    };
  }
  console.log('Message successfully sent by Telegram bot.');
  return {
    message: 'Your telegram message has been sent successfully.',
    status: 200,
  };
}

module.exports = sendTelegram;
