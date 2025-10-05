// Input validation helpers
export const validateString = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): string => {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  if (value.trim().length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters long`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  return value.trim();
};

export const validateNumber = (value: any, fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return num;
};

export const validateRoomCode = (roomCode: any): string => {
  if (!/^\d{6}$/.test(roomCode)) {
    throw new Error('Room code must be exactly 6 digits');
  }
  return roomCode;
};

export default {
  validateString,
  validateNumber,
  validateRoomCode,
};
