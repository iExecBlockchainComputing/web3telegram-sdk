async function sendTelegram({
  chatId,
  message,
  botToken,
  senderName = 'Web3Telegram Dapp',
}) {
  const messageToSend = `Message from: ${senderName}\n${message}`;
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
  ).catch(() => {
    throw new Error('Failed to reach Telegram bot API');
  });
  if (!response.ok) {
    throw new Error(
      `Failed to send Telegram message, bot API answered with status: ${response.status}`
    );
  }
}

export default sendTelegram;
