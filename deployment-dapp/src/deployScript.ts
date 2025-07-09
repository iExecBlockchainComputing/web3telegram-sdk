import { deployApp } from './singleFunction/deployApp.js';
import {
  DOCKER_IMAGE_DEV_TAG,
  DOCKER_IMAGE_PROD_TAG,
  DEPLOY_TARGET_DEV,
  DEPLOY_TARGET_PROD,
} from './config/config.js';
import { getIExec, saveAppAddress } from './utils/utils.js';

const main = async () => {
  // get env variables from GitHub Actions
  const {
    DEPLOY_ENVIRONMENT,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    DOCKER_IMAGE_CHECKSUM_DEV,
    DOCKER_IMAGE_CHECKSUM_PROD,
  } = process.env;

  const deployTarget = DEPLOY_ENVIRONMENT;

  if (
    !deployTarget ||
    (deployTarget !== DEPLOY_TARGET_DEV && deployTarget !== DEPLOY_TARGET_PROD)
  )
    throw Error(`Invalid promote target ${deployTarget}`);

  let privateKey;
  let checksum;
  if (deployTarget === DEPLOY_TARGET_DEV) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
    checksum = DOCKER_IMAGE_CHECKSUM_DEV;
  } else if (deployTarget === DEPLOY_TARGET_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
    checksum = DOCKER_IMAGE_CHECKSUM_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${deployTarget}`);

  const iexec = getIExec(privateKey);

  let dockerImageTag;
  if (deployTarget === DEPLOY_TARGET_DEV) {
    dockerImageTag = DOCKER_IMAGE_DEV_TAG;
  } else if (deployTarget === DEPLOY_TARGET_PROD) {
    dockerImageTag = DOCKER_IMAGE_PROD_TAG;
  }

  console.log(`Deploying with environment: ${deployTarget}`);
  console.log(`Using image tag: ${dockerImageTag}`);
  if (checksum) {
    console.log(`Using pre-computed checksum: ${checksum}`);
  } else {
    console.log('Fetching checksum from Docker Hub...');
  }

  //deploy app
  const address = await deployApp({
    iexec,
    dockerTag: dockerImageTag,
    checksum,
  });
  await saveAppAddress(address);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
