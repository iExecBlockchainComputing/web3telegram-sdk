import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';
import { promises as fs } from 'fs';
import { decryptContent, downloadEncryptedContent } from './decryptContent.js';
import sendTelegram from './telegramService.js';
import {
  validateAppSecret,
  validateProtectedData,
  validateRequesterSecret,
  validateWorkerEnv,
} from './validation.js';

async function writeTaskOutput(path, message) {
  try {
    await fs.writeFile(path, message);
    console.log(`File successfully written at path: ${path}`);
  } catch {
    console.error('Failed to write Task Output');
    process.exit(1);
  }
}

async function start() {
  const { IEXEC_OUT, IEXEC_APP_DEVELOPER_SECRET, IEXEC_REQUESTER_SECRET_1 } =
    process.env;

  // Check worker env
  const workerEnv = validateWorkerEnv({ IEXEC_OUT });
  // Parse the app developer secret environment variable
  let appDeveloperSecret;
  try {
    appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
  } catch {
    throw Error('Failed to parse the developer secret');
  }
  appDeveloperSecret = validateAppSecret(appDeveloperSecret);

  // Parse the requester secret environment variable
  let requesterSecret;
  try {
    requesterSecret = IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw Error('Failed to parse requester secret');
  }
  requesterSecret = validateRequesterSecret(requesterSecret);

  // Parse the protected data and get the requester secret (chatId)
  let protectedData;
  try {
    const deserializer = new IExecDataProtectorDeserializer();
    protectedData = {
      chatId: await deserializer.getValue('telegram_chatId', 'string'),
    };
  } catch (e) {
    throw Error(`Failed to parse ProtectedData: ${e.message}`);
  }
  // Validate the protected data (chatId)
  validateProtectedData(protectedData);

  const encryptedTelegramContent = await downloadEncryptedContent(
    requesterSecret.telegramContentMultiAddr
  );

  const telegramContent = decryptContent(
    encryptedTelegramContent,
    requesterSecret.telegramContentEncryptionKey
  );

  const response = await sendTelegram({
    chatId: protectedData.chatId,
    message: telegramContent,
    botToken: appDeveloperSecret.TELEGRAM_BOT_TOKEN,
    senderName: requesterSecret.senderName,
  });
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/result.txt`,
    JSON.stringify(response, null, 2)
  );
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify({
      'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.txt`,
    })
  );
}

export default start;
