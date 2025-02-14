import {
  DRONE_TARGET_CONFIGURE_ENS_DEV,
  DRONE_TARGET_CONFIGURE_ENS_PROD,
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  WEB3_TELEGRAM_ENS_NAME_DEV,
  WEB3_TELEGRAM_ENS_NAME_PROD,
} from './config/config.js';
import { getIExec, loadAppAddress } from './utils/utils.js';
import { configureEnsName } from './singleFunction/configureEnsName.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    ENS_NAME,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    (DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_PROD &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_CONFIGURE_ENS_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_CONFIGURE_ENS_PROD)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  const appAddress = await loadAppAddress();

  let privateKey;
  let ensName;
  if (
    DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV ||
    DRONE_DEPLOY_TO === DRONE_TARGET_CONFIGURE_ENS_DEV
  ) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
    ensName = ENS_NAME || WEB3_TELEGRAM_ENS_NAME_DEV;
  } else if (
    DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD ||
    DRONE_DEPLOY_TO === DRONE_TARGET_CONFIGURE_ENS_PROD
  ) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
    ensName = ENS_NAME || WEB3_TELEGRAM_ENS_NAME_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  if (!ensName)
    throw Error(`Failed to get ens name for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  await configureEnsName(iexec, appAddress, ensName);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
