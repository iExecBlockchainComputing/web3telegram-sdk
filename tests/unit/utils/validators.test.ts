import { describe, it, expect } from '@jest/globals';
import { ValidationError } from 'yup';
import {
  addressSchema,
  senderNameSchema,
  telegramContentSchema,
  labelSchema,
} from '../../../src/utils/validators.js';
import { getRandomAddress, getRequiredFieldMessage } from '../../test-utils.js';

const CANNOT_BE_NULL_ERROR = new ValidationError('this cannot be null');
const IS_REQUIRED_ERROR = new ValidationError(getRequiredFieldMessage());

describe('addressSchema()', () => {
  describe('validateSync()', () => {
    const address = getRandomAddress();
    const EXPECTED_ERROR = new ValidationError(
      'this should be an ethereum address'
    );

    it('transforms to lowercase', () => {
      const res = addressSchema().validateSync(address);
      expect(res).toBe(address.toLowerCase());
    });
    it('accepts undefined (is not required by default)', () => {
      const res = addressSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts case insensitive ethereum address', () => {
      expect(addressSchema().validateSync(address)).toBeDefined();
      expect(addressSchema().validateSync(address.toUpperCase())).toBeDefined();
      expect(addressSchema().validateSync(address.toLowerCase())).toBeDefined();
    });
    it('does not accept string ending with ".eth"', () => {
      expect(() => addressSchema().validateSync('FOO.eth')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept null', () => {
      expect(() => addressSchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => addressSchema().validateSync('')).toThrow(EXPECTED_ERROR);
    });
    it('does not accept non address string', () => {
      expect(() => addressSchema().validateSync('test')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          addressSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('telegramContentSchema()', () => {
  const desiredSizeInBytes = 512000; // 512 kilo-bytes
  const characterToRepeat = 'A';
  const CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

  describe('validateSync()', () => {
    it('pass with standard content', () => {
      const res = telegramContentSchema().validateSync(CONTENT);
      expect(res).toBe(CONTENT);
    });
    it('blocks too long content', () => {
      expect(() => telegramContentSchema().validateSync(CONTENT + '.')).toThrow(
        'this must be at most 512000 characters'
      );
    });
  });
});

describe('senderNameSchema()', () => {
  describe('validateSync()', () => {
    it('pass with valid senderName', () => {
      const senderName = 'Product Team';
      const res = senderNameSchema().validateSync(senderName);
      expect(res).toBe(senderName);
    });
    it('blocks too short senderName', () => {
      expect(() => senderNameSchema().validateSync('AB')).toThrow(
        'this must be at least 3 characters'
      );
    });
    it('blocks empty characters as senderName', () => {
      expect(() => senderNameSchema().validateSync('   ')).toThrow(
        'this must be at least 3 characters'
      );
    });
    it('blocks too long senderName', () => {
      expect(() =>
        senderNameSchema().validateSync('A very long sender name')
      ).toThrow('this must be at most 20 characters');
    });
  });
});

describe('labelSchema()', () => {
  describe('validateSync()', () => {
    it('pass with valid label', () => {
      const label = 'ID12345678';
      const res = labelSchema().validateSync(label);
      expect(res).toBe(label);
    });
    it('blocks too short label', () => {
      expect(() => labelSchema().validateSync('ID')).toThrow(
        'this must be at least 3 characters'
      );
    });
    it('blocks empty characters as label', () => {
      expect(() => labelSchema().validateSync('   ')).toThrow(
        'this must be at least 3 characters'
      );
    });
    it('blocks too long label', () => {
      expect(() => labelSchema().validateSync('CAMPAIGN2023')).toThrow(
        'this must be at most 10 characters'
      );
    });
  });
});
