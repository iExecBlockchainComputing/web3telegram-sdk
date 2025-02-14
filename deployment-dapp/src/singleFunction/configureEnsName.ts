import { ENS, IExec } from 'iexec';
import { WEB3_TELEGRAM_ENS_DOMAIN } from '../config/config';

export const configureEnsName = async (
  iexec: IExec,
  appAddress: string,
  name: ENS
): Promise<void> => {
  console.log(`Configuring ENS ${name} for app ${appAddress}`);
  const label = name.split(`.${WEB3_TELEGRAM_ENS_DOMAIN}`)[0];
  const { registeredName, registerTxHash } = await iexec.ens.claimName(
    label,
    WEB3_TELEGRAM_ENS_DOMAIN
  );
  console.log(`Claimed ${registeredName} (tx: ${registerTxHash})`);
  const result = await iexec.ens.configureResolution(name, appAddress);
  console.log(`Configured:\n${JSON.stringify(result, undefined, 2)}`);
};
