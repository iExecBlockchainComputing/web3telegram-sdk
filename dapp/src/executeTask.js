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
  IEXEC_OUT,
  appDeveloperSecret,
  requesterSecret,
  datasetFilename = null,
}) {
  // Parse the protected data
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

  // Write individual result file only for single processing
  if (index === 0) {
    await writeTaskOutput(
      `${IEXEC_OUT}/result.txt`,
      JSON.stringify(response, null, 2)
    );
  }

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

  const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE, 10) || 0;
  const results = [];

  if (bulkSize > 0) {
    // Process multiple protected data
    const promises = [];
    for (let index = 1; index <= bulkSize; index += 1) {
      const datasetFilename = process.env[`IEXEC_DATASET_${index}_FILENAME`];

      const promise = processProtectedData({
        index,
        IEXEC_IN,
        IEXEC_OUT: workerEnv.IEXEC_OUT,
        appDeveloperSecret,
        requesterSecret,
        datasetFilename,
      })
        .then((result) => result)
        .catch((error) => ({
          index,
          resultFileName: datasetFilename
            ? `${datasetFilename}.txt`
            : `dataset-${index}.txt`,
          response: {
            status: 500,
            message: `Failed to process dataset ${index}: ${error.message}`,
          },
        }));

      promises.push(promise);
    }

    const bulkResults = await Promise.all(promises);
    results.push(...bulkResults);
  } else {
    // Process single protected data
    const result = await processProtectedData({
      index: 0,
      IEXEC_IN,
      IEXEC_OUT: workerEnv.IEXEC_OUT,
      appDeveloperSecret,
      requesterSecret,
    });

    results.push(result);
  }

  // Generate computed.json - same format for both single and bulk

  // Create result.txt for bulk processing (similar to single processing)
  if (bulkSize > 0) {
    const successCount = results.filter(
      (r) => r.response.status === 200
    ).length;
    const errorCount = results.filter((r) => r.response.status !== 200).length;

    const bulkResult = {
      message: `Bulk processing completed: ${successCount} successful, ${errorCount} failed`,
      status: 200,
      'total-processed': results.length,
      'success-count': successCount,
      'error-count': errorCount,
      'dataset-results': results.map((r) => ({
        index: r.index,
        dataset:
          process.env[`IEXEC_DATASET_${r.index}_FILENAME`] ||
          `dataset-${r.index}`,
        response: r.response,
      })),
    };

    await writeTaskOutput(
      `${workerEnv.IEXEC_OUT}/result.txt`,
      JSON.stringify(bulkResult, null, 2)
    );
  }

  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify(
      {
        'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.txt`,
      },
      null,
      2
    )
  );
}

export default start;
