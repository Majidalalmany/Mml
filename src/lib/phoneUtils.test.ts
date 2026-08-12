import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  checkDuplicateStorePhone,
  checkDuplicateUserPhone,
} from './phoneUtils';

describe('normalizePhoneNumber', () => {
  it('returns empty string for null, undefined, or empty input', () => {
    expect(normalizePhoneNumber(null)).toBe('');
    expect(normalizePhoneNumber(undefined)).toBe('');
    expect(normalizePhoneNumber('')).toBe('');
  });

  it('returns empty string when input has no digits', () => {
    expect(normalizePhoneNumber('abc-+()')).toBe('');
  });

  it('strips non-digit characters', () => {
    expect(normalizePhoneNumber('771-234-567')).toBe('771234567');
    expect(normalizePhoneNumber('(771) 234 567')).toBe('771234567');
  });

  it('removes Yemeni country code with + prefix', () => {
    expect(normalizePhoneNumber('+967771234567')).toBe('771234567');
  });

  it('does not strip the 00967 international prefix (known limitation)', () => {
    expect(normalizePhoneNumber('00967771234567')).toBe('00967771234567');
  });

  it('keeps a 9-digit number starting with 967 unchanged', () => {
    expect(normalizePhoneNumber('967123456')).toBe('967123456');
  });

  it('removes leading zero from 10-digit local numbers', () => {
    expect(normalizePhoneNumber('0771234567')).toBe('771234567');
  });

  it('does not strip leading zero when length is not 10', () => {
    expect(normalizePhoneNumber('077123456')).toBe('077123456');
  });
});

describe('checkDuplicateStorePhone', () => {
  const stores = [
    { id: 's1', name: 'Store One', phone: '+967771234567' },
    { id: 's2', name: 'Store Two', phone: '0779876543' },
    { id: 's3', name: 'Store Three' },
  ];

  it('detects a duplicate across differing formats', () => {
    expect(checkDuplicateStorePhone('0771234567', stores)).toEqual({
      isDuplicate: true,
      existingName: 'Store One',
    });
  });

  it('excludes the current store when editing', () => {
    expect(checkDuplicateStorePhone('0771234567', stores, 's1')).toEqual({
      isDuplicate: false,
    });
  });

  it('returns no duplicate for an unused phone', () => {
    expect(checkDuplicateStorePhone('711111111', stores)).toEqual({
      isDuplicate: false,
    });
  });

  it('returns no duplicate for empty phone input', () => {
    expect(checkDuplicateStorePhone('', stores)).toEqual({ isDuplicate: false });
  });

  it('ignores stores without a phone', () => {
    expect(checkDuplicateStorePhone('anything', stores)).toEqual({
      isDuplicate: false,
    });
  });
});

describe('checkDuplicateUserPhone', () => {
  const users = [
    { id: 'u1', name: 'User One', phone: '+967712345678' },
    { id: 'u2', name: 'User Two', phone: '0733333333' },
  ];

  it('detects a duplicate across differing formats', () => {
    expect(checkDuplicateUserPhone('712345678', users)).toEqual({
      isDuplicate: true,
      existingName: 'User One',
    });
  });

  it('excludes the current user when editing', () => {
    expect(checkDuplicateUserPhone('712345678', users, 'u1')).toEqual({
      isDuplicate: false,
    });
  });

  it('returns no duplicate for an unused phone', () => {
    expect(checkDuplicateUserPhone('799999999', users)).toEqual({
      isDuplicate: false,
    });
  });
});
