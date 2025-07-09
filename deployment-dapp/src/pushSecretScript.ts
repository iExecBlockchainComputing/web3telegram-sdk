import {
  DEPLOY_TARGET_DEV,
  DEPLOY_TARGET_PROD,
  DEPLOY_TARGET_PUSH_SECRET_DEV,
  DEPLOY_TARGET_PUSH_SECRET_PROD,
  WEB3_TELEGRAM_ENS_NAME_DEV,
  WEB3_TELEGRAM_ENS_NAME_PROD,
} from './config/config.js';
import { pushSecret } from './singleFunction/pushSecret.js';
import { resolveName } from './singleFunction/resolveName.js';
import { getIExec, loadAppAddress } from './utils/utils.js';

const main = async () => {
  // get env variables from GitHub Actions
  const {
    DEPLOY_ENVIRONMENT,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    TELEGRAM_BOT_TOKEN_DEV,
    TELEGRAM_BOT_TOKEN_PROD,
  } = process.env;

  const deployTarget = DEPLOY_ENVIRONMENT;

  if (
    !deployTarget ||
    ![
      DEPLOY_TARGET_DEV,
      DEPLOY_TARGET_PROD,
      DEPLOY_TARGET_PUSH_SECRET_DEV,
      DEPLOY_TARGET_PUSH_SECRET_PROD,
    ].includes(deployTarget)
  )
    throw Error(`Invalid promote target ${deployTarget}`);

  let telegramBotToken;
  let privateKey;
  if (
    deployTarget === DEPLOY_TARGET_DEV ||
    deployTarget === DEPLOY_TARGET_PUSH_SECRET_DEV
  ) {
    telegramBotToken = TELEGRAM_BOT_TOKEN_DEV;
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if (
    deployTarget === DEPLOY_TARGET_PROD ||
    deployTarget === DEPLOY_TARGET_PUSH_SECRET_PROD
  ) {
    telegramBotToken = TELEGRAM_BOT_TOKEN_PROD;
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }
  if (!telegramBotToken) throw Error('Missing env TELEGRAM_BOT_TOKEN');
  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${deployTarget}`);

  const iexec = getIExec(privateKey);

  const appAddress = await loadAppAddress().catch(() => {
    console.log('No app address found falling back to ENS');
    let ensName;
    if (deployTarget === DEPLOY_TARGET_PUSH_SECRET_DEV) {
      ensName = WEB3_TELEGRAM_ENS_NAME_DEV;
    } else if (deployTarget === DEPLOY_TARGET_PUSH_SECRET_PROD) {
      ensName = WEB3_TELEGRAM_ENS_NAME_PROD;
    }
    if (!ensName)
      throw Error(`Failed to get ens name for target ${deployTarget}`);
    return resolveName(iexec, ensName);
  });

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  //push app secret to the secret management
  const jsonSecret = JSON.stringify({
    TELEGRAM_BOT_TOKEN: telegramBotToken,
  });
  await pushSecret(iexec, appAddress, jsonSecret);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
