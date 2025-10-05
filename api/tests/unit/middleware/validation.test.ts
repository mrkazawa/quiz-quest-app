import { validateString, validateNumber, validateRoomCode } from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
  describe('validateString', () => {
    it('should validate and trim a valid string', () => {
      const result = validateString('  Valid String  ', 'fieldName');
      expect(result).toBe('Valid String');
    });

    it('should accept string with minimum length', () => {
      const result = validateString('a', 'fieldName', 1);
      expect(result).toBe('a');
    });

    it('should accept string with maximum length', () => {
      const result = validateString('a'.repeat(255), 'fieldName', 1, 255);
      expect(result).toBe('a'.repeat(255));
    });

    it('should throw error when value is null', () => {
      expect(() => validateString(null, 'fieldName')).toThrow('fieldName is required and must be a string');
    });

    it('should throw error when value is undefined', () => {
      expect(() => validateString(undefined, 'fieldName')).toThrow('fieldName is required and must be a string');
    });

    it('should throw error when value is not a string', () => {
      expect(() => validateString(123, 'fieldName')).toThrow('fieldName is required and must be a string');
    });

    it('should throw error when value is an object', () => {
      expect(() => validateString({}, 'fieldName')).toThrow('fieldName is required and must be a string');
    });

    it('should throw error when string is too short after trimming', () => {
      expect(() => validateString('  ', 'fieldName', 1)).toThrow('fieldName must be at least 1 characters long');
    });

    it('should throw error when string is below minimum length', () => {
      expect(() => validateString('ab', 'fieldName', 3)).toThrow('fieldName must be at least 3 characters long');
    });

    it('should throw error when string exceeds maximum length', () => {
      expect(() => validateString('a'.repeat(256), 'fieldName', 1, 255)).toThrow('fieldName must not exceed 255 characters');
    });

    it('should throw error for empty string', () => {
      expect(() => validateString('', 'fieldName')).toThrow('fieldName is required and must be a string');
    });

    it('should accept string with custom min and max length', () => {
      const result = validateString('hello', 'fieldName', 3, 10);
      expect(result).toBe('hello');
    });
  });

  describe('validateNumber', () => {
    it('should validate a valid integer', () => {
      const result = validateNumber(42, 'fieldName');
      expect(result).toBe(42);
    });

    it('should validate zero', () => {
      const result = validateNumber(0, 'fieldName', 0);
      expect(result).toBe(0);
    });

    it('should validate negative integers when min allows', () => {
      const result = validateNumber(-5, 'fieldName', -10, 10);
      expect(result).toBe(-5);
    });

    it('should validate number at minimum bound', () => {
      const result = validateNumber(5, 'fieldName', 5, 10);
      expect(result).toBe(5);
    });

    it('should validate number at maximum bound', () => {
      const result = validateNumber(10, 'fieldName', 5, 10);
      expect(result).toBe(10);
    });

    it('should convert string number to integer', () => {
      const result = validateNumber('42', 'fieldName');
      expect(result).toBe(42);
    });

    it('should throw error for non-integer float', () => {
      expect(() => validateNumber(3.14, 'fieldName')).toThrow('fieldName must be an integer between 0 and 9007199254740991');
    });

    it('should throw error for NaN', () => {
      expect(() => validateNumber(NaN, 'fieldName')).toThrow('fieldName must be an integer between 0 and 9007199254740991');
    });

    it('should throw error for non-numeric string', () => {
      expect(() => validateNumber('abc', 'fieldName')).toThrow('fieldName must be an integer between 0 and 9007199254740991');
    });

    it('should throw error when number is below minimum', () => {
      expect(() => validateNumber(4, 'fieldName', 5, 10)).toThrow('fieldName must be an integer between 5 and 10');
    });

    it('should throw error when number is above maximum', () => {
      expect(() => validateNumber(11, 'fieldName', 5, 10)).toThrow('fieldName must be an integer between 5 and 10');
    });

    it('should throw error for negative number when min is 0', () => {
      expect(() => validateNumber(-1, 'fieldName', 0)).toThrow('fieldName must be an integer between 0 and 9007199254740991');
    });

    it('should throw error for undefined', () => {
      expect(() => validateNumber(undefined, 'fieldName')).toThrow('fieldName must be an integer between 0 and 9007199254740991');
    });

    it('should convert null to 0', () => {
      const result = validateNumber(null, 'fieldName', 0);
      expect(result).toBe(0);
    });
  });

  describe('validateRoomCode', () => {
    it('should validate a 6-digit room code', () => {
      const result = validateRoomCode('123456');
      expect(result).toBe('123456');
    });

    it('should validate room code with leading zeros', () => {
      const result = validateRoomCode('000123');
      expect(result).toBe('000123');
    });

    it('should validate room code starting with 9', () => {
      const result = validateRoomCode('987654');
      expect(result).toBe('987654');
    });

    it('should throw error for 5-digit code', () => {
      expect(() => validateRoomCode('12345')).toThrow('Room code must be exactly 6 digits');
    });

    it('should throw error for 7-digit code', () => {
      expect(() => validateRoomCode('1234567')).toThrow('Room code must be exactly 6 digits');
    });

    it('should throw error for code with letters', () => {
      expect(() => validateRoomCode('12a456')).toThrow('Room code must be exactly 6 digits');
    });

    it('should throw error for code with special characters', () => {
      expect(() => validateRoomCode('123-456')).toThrow('Room code must be exactly 6 digits');
    });

    it('should throw error for empty string', () => {
      expect(() => validateRoomCode('')).toThrow('Room code must be exactly 6 digits');
    });

    it('should validate number input (regex matches)', () => {
      const result = validateRoomCode(123456 as any);
      expect(result).toBe(123456);
    });

    it('should throw error for code with spaces', () => {
      expect(() => validateRoomCode('123 456')).toThrow('Room code must be exactly 6 digits');
    });
  });
});
