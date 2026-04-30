import { NULL_ADDRESS } from 'iexec/utils';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import {
  addressSchema,
  throwIfMissing,
  campaignRequestSchema,
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
  workerpoolAddress = throwIfMissing(),
  campaignRequest,
}: DataProtectorConsumer &
  SendTelegramCampaignParams): Promise<SendTelegramCampaignResponse> => {
  try {
    const vCampaignRequest = campaignRequestSchema()
      .required()
      .label('campaignRequest')
      .validateSync(campaignRequest) as CampaignRequest;

    const vWorkerpoolAddress = addressSchema()
      .required()
      .label('workerpoolAddress')
      .validateSync(workerpoolAddress);

    if (
      vCampaignRequest.workerpool !== NULL_ADDRESS &&
      vCampaignRequest.workerpool.toLowerCase() !==
        vWorkerpoolAddress.toLowerCase()
    ) {
      throw new ValidationError(
        "workerpoolAddress doesn't match campaignRequest workerpool"
      );
    }

    // Process bulk request
    const processBulkRequestResponse: ProcessBulkRequestResponse<ProcessBulkRequestParams> =
      await dataProtector.processBulkRequest({
        bulkRequest: vCampaignRequest,
        workerpool: vWorkerpoolAddress,
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
