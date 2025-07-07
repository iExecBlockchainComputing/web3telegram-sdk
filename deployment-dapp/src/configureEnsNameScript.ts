import {
  DEPLOY_TARGET_CONFIGURE_ENS_DEV,
  DEPLOY_TARGET_CONFIGURE_ENS_PROD,
  DEPLOY_TARGET_DEV,
  DEPLOY_TARGET_PROD,
  WEB3_TELEGRAM_ENS_NAME_DEV,
  WEB3_TELEGRAM_ENS_NAME_PROD,
} from './config/config.js';
import { getIExec, loadAppAddress } from './utils/utils.js';
import { configureEnsName } from './singleFunction/configureEnsName.js';

const main = async () => {
  // get env variables from GitHub Actions
  const {
    DEPLOY_ENVIRONMENT,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    DEPLOYED_APP_ADDRESS, // if already deployed in a previous step and want to configure ENS promoting configure-ens pipeline
    ENS_NAME,
  } = process.env;

  const deployTarget = DEPLOY_ENVIRONMENT;

  if (
    !deployTarget ||
    (deployTarget !== DEPLOY_TARGET_DEV &&
      deployTarget !== DEPLOY_TARGET_PROD &&
      deployTarget !== DEPLOY_TARGET_CONFIGURE_ENS_DEV &&
      deployTarget !== DEPLOY_TARGET_CONFIGURE_ENS_PROD)
  )
    throw Error(`Invalid promote target ${deployTarget}`);

  const appAddress = DEPLOYED_APP_ADDRESS ?? (await loadAppAddress()); // use ALREADY_DEPLOYED_APP_ADDRESS when promoting configure-ens pipeline
  let privateKey;
  let ensName;
  if (
    deployTarget === DEPLOY_TARGET_DEV ||
    deployTarget === DEPLOY_TARGET_CONFIGURE_ENS_DEV
  ) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
    ensName = ENS_NAME ?? WEB3_TELEGRAM_ENS_NAME_DEV;
  } else if (
    deployTarget === DEPLOY_TARGET_PROD ||
    deployTarget === DEPLOY_TARGET_CONFIGURE_ENS_PROD
  ) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
    ensName = ENS_NAME ?? WEB3_TELEGRAM_ENS_NAME_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${deployTarget}`);

  if (!ensName)
    throw Error(`Failed to get ens name for target ${deployTarget}`);

  const iexec = getIExec(privateKey);

  await configureEnsName(iexec, appAddress, ensName);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
