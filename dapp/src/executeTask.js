import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';
import { promises as fs } from 'fs';
import path from 'node:path';
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

async function processProtectedData(
  index,
  {
    IEXEC_IN,
    IEXEC_OUT,
    appDeveloperSecret,
    requesterSecret,
    datasetFilename = null,
  }
) {
  // Parse the protected data
  let protectedData;
  try {
    const deserializerConfig = datasetFilename
      ? { protectedDataPath: path.join(IEXEC_IN, datasetFilename) }
      : {};

    const deserializer = new IExecDataProtectorDeserializer(deserializerConfig);
    protectedData = {
      chatId: await deserializer.getValue('telegram_chatId', 'string'),
    };
  } catch (e) {
    throw Error(`Failed to parse ProtectedData ${index}: ${e.message}`);
  }

  // Validate the protected data
  validateProtectedData(protectedData);

  // Download and decrypt content
  const encryptedTelegramContent = await downloadEncryptedContent(
    requesterSecret.telegramContentMultiAddr
  );

  const telegramContent = decryptContent(
    encryptedTelegramContent,
    requesterSecret.telegramContentEncryptionKey
  );

  // Send telegram message
  const response = await sendTelegram({
    chatId: protectedData.chatId,
    message: telegramContent,
    botToken: appDeveloperSecret.TELEGRAM_BOT_TOKEN,
    senderName: requesterSecret.senderName,
  });

  // Write individual result file
  const resultFileName = index > 0 ? `${datasetFilename}.txt` : 'result.txt';
  await writeTaskOutput(
    path.join(IEXEC_OUT, resultFileName),
    JSON.stringify(response, null, 2)
  );

  return { index, response, resultFileName };
}

async function start() {
  const {
    IEXEC_OUT,
    IEXEC_IN,
    IEXEC_APP_DEVELOPER_SECRET,
    IEXEC_REQUESTER_SECRET_1,
    IEXEC_BULK_SLICE_SIZE,
  } = process.env;

  // Check worker env
  const workerEnv = validateWorkerEnv({ IEXEC_OUT });

  // Parse the app developer secret
  let appDeveloperSecret;
  try {
    appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
  } catch {
    throw Error('Failed to parse the developer secret');
  }
  appDeveloperSecret = validateAppSecret(appDeveloperSecret);

  // Parse the requester secret
  let requesterSecret;
  try {
    requesterSecret = IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw Error('Failed to parse requester secret');
  }
  requesterSecret = validateRequesterSecret(requesterSecret);

  const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE) || 0;

  const results = [];

  if (bulkSize > 0) {
    // Process multiple protected data
    for (let i = 1; i <= bulkSize; i++) {
      const datasetFilename = process.env[`IEXEC_DATASET_${i}_FILENAME`];

      const result = await processProtectedData(i, {
        IEXEC_IN,
        IEXEC_OUT: workerEnv.IEXEC_OUT,
        appDeveloperSecret,
        requesterSecret,
        datasetFilename,
      });

      results.push(result);
    }
  } else {
    // Process single protected data
    const result = await processProtectedData(0, {
      IEXEC_IN,
      IEXEC_OUT: workerEnv.IEXEC_OUT,
      appDeveloperSecret,
      requesterSecret,
    });

    results.push(result);
  }

  // Write computed.json with all results
  const computedOutput = {
    'deterministic-output-path': workerEnv.IEXEC_OUT,
    'bulk-results': results.map((r) => ({
      index: r.index,
      file: r.resultFileName,
      status: r.response.status === 200 ? 'success' : 'error',
    })),
    'total-processed': results.length,
  };

  await writeTaskOutput(
    path.join(workerEnv.IEXEC_OUT, 'computed.json'),
    JSON.stringify(computedOutput, null, 2)
  );
}

export default start;
