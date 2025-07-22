import { pushSecret } from './singleFunction/pushSecret.js';
import { getIExec, loadAppAddress } from './utils/utils.js';

const main = async () => {
  const { RPC_URL, WALLET_PRIVATE_KEY, TELEGRAM_BOT_TOKEN } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);
  if (!TELEGRAM_BOT_TOKEN) throw Error('Missing env TELEGRAM_BOT_TOKEN');

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);

  const appAddress = await loadAppAddress();

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  const jsonSecret = JSON.stringify({
    TELEGRAM_BOT_TOKEN,
  });

  await pushSecret(iexec, appAddress, jsonSecret);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
