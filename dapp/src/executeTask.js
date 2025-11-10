import { promises as fs } from 'fs';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';
import { decryptContent, downloadEncryptedContent } from './decryptContent.js';
import sendTelegram from './telegramService.js';
import {
  validateAppSecret,
  validateProtectedData,
  validateRequesterSecret,
  validateWorkerEnv,
} from './validation.js';

async function processProtectedData({
  index,
  IEXEC_IN,
  appDeveloperSecret,
  requesterSecret,
}) {
  const datasetFilename =
    index > 0
      ? process.env[`IEXEC_DATASET_${index}_FILENAME`]
      : process.env.IEXEC_DATASET_FILENAME;
  const result = { index, protectedData: datasetFilename };
  try {
    let protectedData;
    try {
      const deserializerConfig = datasetFilename
        ? { protectedDataPath: `${IEXEC_IN}/${datasetFilename}` }
        : {};

      const deserializer = new IExecDataProtectorDeserializer(
        deserializerConfig
      );
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

    await sendTelegram({
      chatId: protectedData.chatId,
      message: telegramContent,
      botToken: appDeveloperSecret.TELEGRAM_BOT_TOKEN,
      senderName: requesterSecret.senderName,
    });
    result.success = true;
  } catch (e) {
    result.success = false;
    result.error = e.message;
  }
  return result;
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

  let result; // { success: boolean, error?: string ,  protectedData?: string,  results?: { index: number, protectedData: string, success: boolean, error?: string }[] }
  try {
    let appDeveloperSecret;
    try {
      appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
    } catch {
      throw Error('Failed to parse the developer secret');
    }
    appDeveloperSecret = validateAppSecret(appDeveloperSecret);

    let requesterSecret;
    try {
      requesterSecret = JSON.parse(IEXEC_REQUESTER_SECRET_1);
    } catch {
      throw Error('Failed to parse requester secret');
    }

    requesterSecret = validateRequesterSecret(requesterSecret);

    const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE, 10) || 0;

    // Process multiple protected data
    if (bulkSize > 0) {
      const processPromises = new Array(bulkSize).fill(null).map((_, index) =>
        processProtectedData({
          index: index + 1,
          IEXEC_IN,
          appDeveloperSecret,
          requesterSecret,
        })
      );
      const results = await Promise.all(processPromises);
      const successCount = results.filter((r) => r.success === true).length;
      const errorCount = results.filter((r) => r.success !== true).length;
      result = {
        success: errorCount === 0,
        error: errorCount > 0 ? 'Partial failure' : undefined,
        totalCount: results.length,
        successCount,
        errorCount,
        results: results.map((r) => ({
          index: r.index,
          protectedData: r.protectedData,
          success: r.success,
          error: r.error,
        })),
      };
    } else {
      const { protectedData, success, error } = await processProtectedData({
        index: 0,
        IEXEC_IN,
        appDeveloperSecret,
        requesterSecret,
      });
      result = { protectedData, success, error };
    }
  } catch (e) {
    result = { success: false, error: e.message };
  }

  await fs.writeFile(
    `${workerEnv.IEXEC_OUT}/result.json`,
    JSON.stringify(result, null, 2)
  );
  await fs.writeFile(
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
