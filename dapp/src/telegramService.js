
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

  console.log('removed lib for testing');

  return {
    message: 'Your telegram message has been sent successfully.',
    status: 200,
  };
}

export default sendTelegram;
