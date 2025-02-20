import { isAddress } from 'ethers';
import { IExec } from 'iexec';
import { ValidationError, boolean, number, string } from 'yup';

export const isValidProvider = async (iexec: IExec) => {
  const client = await iexec.config.resolveContractsClient();
  if (!client.signer) {
    throw new Error(
      'Unauthorized method. Please log in with your wallet, you must set a valid provider with a signer.'
    );
  }
};

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};

const isUndefined = (value: unknown) => value === undefined;
const isAddressTest = (value: string) => isAddress(value);
export const isEnsTest = (value: string) =>
  value.endsWith('.eth') && value.length > 6;

export const addressOrEnsSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address-or-ens',
      '${path} should be an ethereum address or a ENS name',
      (value) => isUndefined(value) || isAddressTest(value) || isEnsTest(value)
    );

export const addressSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address',
      '${path} should be an ethereum address',
      (value) => isUndefined(value) || isAddressTest(value)
    );

// Limit of 512,000 bytes (512 kilo-bytes)
// TODO Check what limit to put here
export const telegramContentSchema = () => string().max(512000);

// Minimum of 3 characters and max of 20 to avoid sender being flagged as spam
export const senderNameSchema = () => string().trim().min(3).max(20).optional();

// identify the label of the campaign, minimum of 3 characters and max of 10
export const labelSchema = () => string().trim().min(3).max(10).optional();

export const positiveNumberSchema = () =>
  number().integer().min(0).typeError('${path} must be a non-negative number');

export const booleanSchema = () =>
  boolean().strict().typeError('${path} should be a boolean');
