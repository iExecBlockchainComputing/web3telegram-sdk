import { NULL_ADDRESS } from 'iexec/utils';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsSchema,
  throwIfMissing,
  campaignRequestSchema,
  booleanSchema,
} from '../utils/validators.js';
import { DataProtectorConsumer } from './internalTypes.js';
import {
  ProcessBulkRequestParams,
  ProcessBulkRequestResponse,
} from '@iexec/dataprotector';
import { ValidationError } from 'yup';
import {
  CampaignRequest,
  SendTelegramCampaignParams,
  SendTelegramCampaignResponse,
} from './types.js';

export type SendTelegramCampaign = typeof sendTelegramCampaign;

export const sendTelegramCampaign = async ({
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  campaignRequest,
  allowDeposit = false,
}: DataProtectorConsumer &
  SendTelegramCampaignParams): Promise<SendTelegramCampaignResponse> => {
  try {
    const vCampaignRequest = campaignRequestSchema()
      .required()
      .label('campaignRequest')
      .validateSync(campaignRequest) as CampaignRequest;

    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
      .required()
      .label('WorkerpoolAddressOrEns')
      .validateSync(workerpoolAddressOrEns);

    const vAllowDeposit = booleanSchema()
      .label('allowDeposit')
      .validateSync(allowDeposit);

    if (
      vCampaignRequest.workerpool !== NULL_ADDRESS &&
      vCampaignRequest.workerpool.toLowerCase() !==
        vWorkerpoolAddressOrEns.toLowerCase()
    ) {
      throw new ValidationError(
        "workerpoolAddressOrEns doesn't match campaignRequest workerpool"
      );
    }

    // Process bulk request
    // TODO: Remove @ts-ignore once @iexec/dataprotector is updated to a version that includes allowDeposit in ProcessBulkRequestParams types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - allowDeposit is supported at runtime but not yet in TypeScript types
    const processBulkRequestResponse: ProcessBulkRequestResponse<ProcessBulkRequestParams> =
      await dataProtector.processBulkRequest({
        bulkRequest: vCampaignRequest,
        workerpool: vWorkerpoolAddressOrEns,
        allowDeposit: vAllowDeposit,
      });

    return processBulkRequestResponse;
  } catch (error) {
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }
    handleIfProtocolError(error);
    const isProcessProtectedDataError =
      error instanceof Error &&
      error.message === 'Failed to process protected data';
    if (isProcessProtectedDataError) {
      const cause = (error as any)?.cause;
      const unwrappedCause = cause instanceof Error ? cause : error;
      throw new WorkflowError({
        message: 'Failed to sendTelegramCampaign',
        errorCause: unwrappedCause,
      });
    }
    throw new WorkflowError({
      message: 'Failed to sendTelegramCampaign',
      errorCause: error,
    });
  }
};
