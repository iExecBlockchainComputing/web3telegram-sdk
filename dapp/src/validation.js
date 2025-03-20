import Joi from 'joi';

const workerEnvSchema = Joi.object({
  IEXEC_OUT: Joi.string().required(),
});

export function validateWorkerEnv(envVars) {
  const { error, value } = workerEnvSchema.validate(envVars, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`Worker environment error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const appSecretSchema = Joi.object({
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
});

export function validateAppSecret(obj) {
  const { error, value } = appSecretSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`App secret error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const protectedDataChatIdSchema = Joi.object({
  chatId: Joi.alternatives()
    .try(
      Joi.number().integer().positive(), // Numeric chat IDs
      Joi.string().pattern(/^@?[a-zA-Z0-9_]{5,32}$/) // Username chat IDs
    )
    .messages({
      'string.pattern.base': '"chatId" must be a valid Telegram chat ID',
    })
    .required(),
});

export function validateProtectedData(obj) {
  const { error, value } = protectedDataChatIdSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`ProtectedData error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const requesterSecretSchema = Joi.object({
  telegramContentMultiAddr: Joi.string()
    .pattern(/^\/(ipfs|p2p)\//)
    .message('"telegramContentMultiAddr" must be a multiAddr')
    .required(),
  telegramContentEncryptionKey: Joi.string().base64(),
  senderName: Joi.string().min(3).max(20),
});

export function validateRequesterSecret(obj) {
  const { error, value } = requesterSecretSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`Requester secret error: ${validationErrors.join('; ')}`);
  }
  return value;
}
