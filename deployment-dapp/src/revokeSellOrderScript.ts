import { getIExec, loadAppAddress } from './utils/utils.js';
import { revokeSellOrder } from './singleFunction/revokeSellOrder.js';
import { resolveName } from './singleFunction/resolveName.js';
import {
  DEPLOY_TARGET_REVOKE_SELL_ORDER_DEV,
  DEPLOY_TARGET_REVOKE_SELL_ORDER_PROD,
  DEPLOY_TARGET_DEV,
  DEPLOY_TARGET_PROD,
  WEB3_TELEGRAM_ENS_NAME_DEV,
  WEB3_TELEGRAM_ENS_NAME_PROD,
} from './config/config.js';
import { orderHashSchema } from './utils/validator.js';

const main = async () => {
  // get env variables from GitHub Actions
  const {
    DEPLOY_ENVIRONMENT,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    ORDER_HASH,
  } = process.env;

  const deployTarget = DEPLOY_ENVIRONMENT;

  if (
    !deployTarget ||
    ![
      DEPLOY_TARGET_DEV,
      DEPLOY_TARGET_REVOKE_SELL_ORDER_DEV,
      DEPLOY_TARGET_PROD,
      DEPLOY_TARGET_REVOKE_SELL_ORDER_PROD,
    ].includes(deployTarget)
  )
    throw Error(`Invalid promote target ${deployTarget}`);

  let privateKey;
  if (
    [DEPLOY_TARGET_DEV, DEPLOY_TARGET_REVOKE_SELL_ORDER_DEV].includes(
      deployTarget
    )
  ) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if (
    [DEPLOY_TARGET_PROD, DEPLOY_TARGET_REVOKE_SELL_ORDER_PROD].includes(
      deployTarget
    )
  ) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${deployTarget}`);

  const iexec = getIExec(privateKey);

  const appAddress = await loadAppAddress().catch(() => {
    console.log('No app address found falling back to ENS');
    let ensName;
    if (deployTarget === DEPLOY_TARGET_REVOKE_SELL_ORDER_DEV) {
      ensName = WEB3_TELEGRAM_ENS_NAME_DEV;
    } else if (deployTarget === DEPLOY_TARGET_REVOKE_SELL_ORDER_PROD) {
      ensName = WEB3_TELEGRAM_ENS_NAME_PROD;
    }
    if (!ensName)
      throw Error(`Failed to get ens name for target ${deployTarget}`);
    return resolveName(iexec, ensName);
  });

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  // validate params
  const orderHash = await orderHashSchema().validate(ORDER_HASH);

  //revoke sell order for Tee app (scone)
  const txHash = await revokeSellOrder(iexec, orderHash);
  if (!txHash) throw Error(`Failed to revoke app sell order: ${orderHash}`);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
