import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./firebase', () => ({
  db: {},
  collection: vi.fn(() => 'audit_logs_ref'),
  addDoc: vi.fn(),
}));

import { addDoc, collection } from './firebase';
import { logSystemActivity, logAuditEvent } from './auditLogger';

const mockedAddDoc = vi.mocked(addDoc);
const mockedCollection = vi.mocked(collection);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logSystemActivity', () => {
  it('writes a full audit log entry to the audit_logs collection', async () => {
    mockedAddDoc.mockResolvedValueOnce({} as never);

    await logSystemActivity({
      action: 'DELETE_STORE',
      performedBy: 'admin-1',
      userEmail: 'admin@example.com',
      userRole: 'super_admin',
      targetType: 'store',
      targetName: 'Store One',
      details: 'Deleted via dashboard',
      severity: 'warning',
    });

    expect(mockedCollection).toHaveBeenCalledWith(expect.anything(), 'audit_logs');
    expect(mockedAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockedAddDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      action: 'DELETE_STORE',
      performedBy: 'admin-1',
      userEmail: 'admin@example.com',
      userRole: 'super_admin',
      targetType: 'store',
      targetName: 'Store One',
      details: 'Deleted via dashboard',
      severity: 'warning',
    });
    expect(typeof payload.createdAt).toBe('string');
  });

  it('applies default values for optional fields', async () => {
    mockedAddDoc.mockResolvedValueOnce({} as never);

    await logSystemActivity({
      action: 'LOGIN',
      performedBy: 'admin-2',
      targetType: 'system',
    });

    const payload = mockedAddDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      userEmail: 'system@jahez.com',
      userRole: 'general_manager',
      targetName: '',
      details: '',
      severity: 'info',
    });
  });

  it('swallows Firestore errors instead of throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedAddDoc.mockRejectedValueOnce(new Error('firestore down'));

    await expect(
      logSystemActivity({ action: 'X', performedBy: 'u', targetType: 'system' })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('logAuditEvent', () => {
  it('is an alias of logSystemActivity', () => {
    expect(logAuditEvent).toBe(logSystemActivity);
  });
});
