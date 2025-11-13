import { NULL_ADDRESS } from 'iexec/utils';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsSchema,
  throwIfMissing,
  campaignRequestSchema,
} from '../utils/validators.js';
import { DataProtectorConsumer } from './internalTypes.js';
import {
  BulkRequest,
  ProcessBulkRequestParams,
  ProcessBulkRequestResponse,
} from '@iexec/dataprotector';
import { ValidationError } from 'yup';
import {
  SendTelegramCampaignParams,
  SendTelegramCampaignResponse,
} from './types.js';

export type SendTelegramCampaign = typeof sendTelegramCampaign;

export const sendTelegramCampaign = async ({
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  campaignRequest,
}: DataProtectorConsumer &
  SendTelegramCampaignParams): Promise<SendTelegramCampaignResponse> => {
  try {
    const vCampaignRequest = campaignRequestSchema()
      .required()
      .label('campaignRequest')
      .validateSync(campaignRequest) as BulkRequest;

    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
      .required()
      .label('WorkerpoolAddressOrEns')
      .validateSync(workerpoolAddressOrEns);

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
    const processBulkRequestResponse: ProcessBulkRequestResponse<ProcessBulkRequestParams> =
      await dataProtector.processBulkRequest({
        bulkRequest: vCampaignRequest as BulkRequest,
        workerpool: vWorkerpoolAddressOrEns,
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
