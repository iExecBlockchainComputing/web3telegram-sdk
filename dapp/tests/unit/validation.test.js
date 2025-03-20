import {
  validateAppSecret,
  validateProtectedData,
  validateRequesterSecret,
  validateWorkerEnv,
} from '../../src/validation';

describe('validateWorkerEnv function', () => {
  it('should pass if all input values are valid', () => {
    expect(() =>
      validateWorkerEnv({
        IEXEC_OUT: '/path/to/iexec/out',
      })
    ).not.toThrow();
  });

  it('should throw an error if any required input is missing', () => {
    expect(() => validateWorkerEnv({})).toThrow(
      new Error('Worker environment error: "IEXEC_OUT" is required')
    );
  });
});

describe('validateAppSecret function', () => {
  it('should throw an error if any required input is missing', () => {
    expect(() => validateAppSecret({})).toThrow(
      /"TELEGRAM_BOT_TOKEN" is required/i
    );
  });

  it('should throw an error if botToken is not a string', () => {
    expect(() =>
      validateAppSecret({
        TELEGRAM_BOT_TOKEN: 123,
      })
    ).toThrow(
      new Error('App secret error: "TELEGRAM_BOT_TOKEN" must be a string')
    );
  });
});

describe('validateRequesterSecret function', () => {
  let testedObj;

  beforeEach(() => {
    testedObj = {
      telegramContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      telegramContentEncryptionKey:
        'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      senderName: 'sender test name',
    };
  });

  it('should pass if all input values are valid', () => {
    expect(() => validateRequesterSecret(testedObj)).not.toThrow();
  });

  it('should accept valid senderName', () => {
    const res = validateRequesterSecret({
      ...testedObj,
      senderName: 'Product Team',
    });
    expect(res.senderName).toStrictEqual('Product Team');
  });

  it('should accept an undefined senderName', () => {
    const res = validateRequesterSecret({
      ...testedObj,
      senderName: undefined,
    });
    expect(res.senderName).toBeUndefined();
  });

  it('should not accept an empty senderName', () => {
    expect(() =>
      validateRequesterSecret({
        ...testedObj,
        senderName: '',
      })
    ).toThrow(
      new Error(
        'Requester secret error: "senderName" is not allowed to be empty'
      )
    );
  });

  it('should throw an error if the telegramContentMultiAddr value is not a valid multiAddr', () => {
    testedObj.telegramContentMultiAddr = 'not a multiAddr';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      new Error(
        'Requester secret error: "telegramContentMultiAddr" must be a multiAddr'
      )
    );
  });

  it('should throw an error if the telegramContentEncryptionKey value is not a valid base64 string', () => {
    testedObj.telegramContentEncryptionKey = 'not a base64 string';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      new Error(
        'Requester secret error: "telegramContentEncryptionKey" must be a valid base64 string'
      )
    );
  });

  it('should include all validation errors in the thrown error message', () => {
    testedObj.telegramContentEncryptionKey = 'not a base64 string';
    testedObj.telegramContentMultiAddr = 'not a multiAddr';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      new Error(
        'Requester secret error: "telegramContentMultiAddr" must be a multiAddr; "telegramContentEncryptionKey" must be a valid base64 string'
      )
    );
  });
});

describe('validateProtectedData function', () => {
  it('should not throw an error if all input values are valid', () => {
    expect(() =>
      validateProtectedData({
        chatId: '@username',
      })
    ).not.toThrow();
  });

  it('should not throw an error if all input values are valid', () => {
    const res = validateProtectedData({
      chatId: '123',
    });
    expect(res).toStrictEqual({ chatId: 123 });
  });

  it('should throw an error if any required input is missing', () => {
    expect(() => validateProtectedData({})).toThrow(
      new Error('ProtectedData error: "chatId" is required')
    );
  });

  it('should throw an error if chatId is not valid', () => {
    expect(() =>
      validateProtectedData({
        chatId: '@#123',
      })
    ).toThrow(
      new Error(
        `ProtectedData error: "chatId" must be a valid Telegram chat ID`
      )
    );
  });
});
