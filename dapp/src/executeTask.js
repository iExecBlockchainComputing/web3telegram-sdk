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

async function processProtectedData({
  index,
  IEXEC_IN,
  appDeveloperSecret,
  requesterSecret,
}) {
  const datasetFilename =
    index > 0 ? process.env[`IEXEC_DATASET_${index}_FILENAME`] : null;

  let protectedData;
  try {
    const deserializerConfig = datasetFilename
      ? { protectedDataPath: `${IEXEC_IN}/${datasetFilename}` }
      : {};

    const deserializer = new IExecDataProtectorDeserializer(deserializerConfig);
    protectedData = {
      chatId: await deserializer.getValue('telegram_chatId', 'string'),
    };
  } catch (e) {
    throw Error(`Failed to parse ProtectedData ${index}: ${e.message}`);
  }

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

  return { index, response };
}

async function start() {
  const {
    IEXEC_OUT,
    IEXEC_APP_DEVELOPER_SECRET,
    IEXEC_REQUESTER_SECRET_1,
    IEXEC_IN,
    IEXEC_BULK_SLICE_SIZE,
  } = process.env;

  const workerEnv = validateWorkerEnv({ IEXEC_OUT });

  let appDeveloperSecret;
  try {
    appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
  } catch {
    throw Error('Failed to parse the developer secret');
  }
  appDeveloperSecret = validateAppSecret(appDeveloperSecret);

  let requesterSecret;
  try {
    requesterSecret = IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw Error('Failed to parse requester secret');
  }
  requesterSecret = validateRequesterSecret(requesterSecret);

  const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE, 10) || 0;

  // Process multiple protected data
  if (bulkSize > 0) {
    const promises = [];
    for (let index = 1; index <= bulkSize; index += 1) {
      const promise = processProtectedData({
        index,
        IEXEC_IN,
        appDeveloperSecret,
        requesterSecret,
      }).catch((error) => {
        const datasetFilename = process.env[`IEXEC_DATASET_${index}_FILENAME`];
        return {
          index,
          resultFileName: datasetFilename
            ? `${datasetFilename}.txt`
            : `dataset-${index}.txt`,
          response: {
            status: 500,
            message: `Failed to process protected-data ${index}. Cause: ${error.message}`,
          },
        };
      });

      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // Write result.json for bulk processing
    const successCount = results.filter(
      (r) => r.response.status === 200
    ).length;
    const errorCount = results.filter((r) => r.response.status !== 200).length;

    const bulkResult = {
      message: `Bulk processing completed: ${successCount} successful, ${errorCount} failed`,
      'total-count': results.length,
      'success-count': successCount,
      'error-count': errorCount,
      results: results.map((r) => ({
        index: r.index,
        'protected-data':
          process.env[`IEXEC_DATASET_${r.index}_FILENAME`] ||
          `dataset-${r.index}`,
        response: r.response,
      })),
    };

    await writeTaskOutput(
      `${workerEnv.IEXEC_OUT}/result.json`,
      JSON.stringify(bulkResult, null, 2)
    );
  } else {
    // Process single protected data
    const result = await processProtectedData({
      index: 0,
      IEXEC_IN,
      appDeveloperSecret,
      requesterSecret,
    });

    await writeTaskOutput(
      `${workerEnv.IEXEC_OUT}/result.json`,
      JSON.stringify(result.response, null, 2)
    );
  }

  // Generate computed.json - same format for both single and bulk
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify(
      {
        'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.json`,
      },
      null,
      2
    )
  );
}

export default start;
