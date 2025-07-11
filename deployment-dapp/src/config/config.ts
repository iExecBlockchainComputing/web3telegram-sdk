import { readFileSync } from 'fs';

//hosting url
export const HOST = 'https://bellecour.iex.ec';

//deployment parameters
export const APP_NAME = 'web3telegram';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const DEFAULT_APP_PRICE = 0;
export const DEFAULT_APP_VOLUME = 1000000;
export const APP_TAG = ['tee', 'scone'];

//ENS name
export const WEB3_TELEGRAM_ENS_DOMAIN = 'apps.iexec.eth';
export const WEB3_TELEGRAM_ENS_NAME_DEV = `web3telegram-test.${WEB3_TELEGRAM_ENS_DOMAIN}`;
export const WEB3_TELEGRAM_ENS_NAME_PROD = `web3telegram.${WEB3_TELEGRAM_ENS_DOMAIN}`;

export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'web3telegram-dapp';

// Use environment variable for sconified image tag if provided, otherwise fallback to computed tags
export const DOCKER_IMAGE_PROD_TAG = process.env.SCONIFIED_IMAGE_TAG;
export const DOCKER_IMAGE_DEV_TAG = process.env.SCONIFIED_IMAGE_TAG;

//deployment targets for GitHub Actions
export const DEPLOY_TARGET_DEV = 'dapp-dev';
export const DEPLOY_TARGET_PROD = 'dapp-prod';
export const DEPLOY_TARGET_SELL_ORDER_DEV = 'dapp-publish-sell-order-dev';
export const DEPLOY_TARGET_SELL_ORDER_PROD = 'dapp-publish-sell-order-prod';
export const DEPLOY_TARGET_REVOKE_SELL_ORDER_DEV = 'dapp-revoke-sell-order-dev';
export const DEPLOY_TARGET_REVOKE_SELL_ORDER_PROD =
  'dapp-revoke-sell-order-prod';
export const DEPLOY_TARGET_PUSH_SECRET_DEV = 'dapp-push-secret-dev';
export const DEPLOY_TARGET_PUSH_SECRET_PROD = 'dapp-push-secret-prod';
export const DEPLOY_TARGET_CONFIGURE_ENS_DEV = 'configure-ens-dev';
export const DEPLOY_TARGET_CONFIGURE_ENS_PROD = 'configure-ens-prod';
