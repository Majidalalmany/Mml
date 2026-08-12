import { describe, it, expect } from 'vitest';
import {
  ALL_MODULES,
  ROLE_DEFINITIONS,
  hasModulePermission,
  PermissionMap,
} from './permissions';
import { AdminUser, RoleType } from '../types';

const makeUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'u1',
  name: 'Test User',
  phone: '771234567',
  role: 'accountant',
  status: 'active',
  ...overrides,
});

describe('ROLE_DEFINITIONS', () => {
  it('defines every role id consistently', () => {
    for (const [key, def] of Object.entries(ROLE_DEFINITIONS)) {
      expect(def.id).toBe(key);
    }
  });

  it('gives developer and super_admin full permissions on all modules', () => {
    for (const role of ['developer', 'super_admin'] as RoleType[]) {
      const perms = ROLE_DEFINITIONS[role].defaultPermissions;
      for (const m of ALL_MODULES) {
        expect(perms[m.id]).toEqual({ view: true, create: true, edit: true, delete: true });
      }
    }
  });

  it('gives auditor read-only permissions on all modules', () => {
    const perms = ROLE_DEFINITIONS.auditor.defaultPermissions;
    for (const m of ALL_MODULES) {
      expect(perms[m.id]).toEqual({ view: true, create: false, edit: false, delete: false });
    }
  });

  it('restricts vice_admin from deleting users and from settings', () => {
    const perms = ROLE_DEFINITIONS.vice_admin.defaultPermissions;
    expect(perms.admin).toEqual({ view: true, create: true, edit: true, delete: false });
    expect(perms.settings).toEqual({ view: false, create: false, edit: false, delete: false });
  });
});

describe('hasModulePermission with AdminUser', () => {
  it('always grants access to super_admin and developer roles', () => {
    expect(hasModulePermission(makeUser({ role: 'super_admin' }), 'settings', 'delete')).toBe(true);
    expect(hasModulePermission(makeUser({ role: 'developer' }), 'admin', 'delete')).toBe(true);
  });

  it('always grants access to admin@gmail.com regardless of role', () => {
    const user = makeUser({ role: 'accountant', email: 'admin@gmail.com' });
    expect(hasModulePermission(user, 'settings', 'delete')).toBe(true);
  });

  it('uses explicit user permissions over role defaults', () => {
    const user = makeUser({
      role: 'accountant',
      permissions: { reports: { view: false, create: false, edit: true, delete: false } },
    });
    expect(hasModulePermission(user, 'reports', 'edit')).toBe(true);
    expect(hasModulePermission(user, 'reports', 'view')).toBe(false);
  });

  it('falls back to role default permissions', () => {
    const user = makeUser({ role: 'accountant' });
    expect(hasModulePermission(user, 'orders', 'view')).toBe(true);
    expect(hasModulePermission(user, 'orders', 'edit')).toBe(false);
    expect(hasModulePermission(user, 'products', 'view')).toBe(false);
  });

  it('defaults the action to view when omitted', () => {
    const user = makeUser({ role: 'accountant' });
    expect(hasModulePermission(user, 'dashboard')).toBe(true);
  });

  it('returns false for an unknown module', () => {
    const user = makeUser({ role: 'accountant' });
    expect(hasModulePermission(user, 'nonexistent', 'view')).toBe(false);
  });
});

describe('hasModulePermission with (permissions, role, moduleId, action) signature', () => {
  it('grants everything to super_admin and developer', () => {
    expect(hasModulePermission(undefined, 'super_admin', 'settings', 'delete')).toBe(true);
    expect(hasModulePermission(undefined, 'developer', 'admin', 'delete')).toBe(true);
  });

  it('uses the explicit permission map first', () => {
    const perms: PermissionMap = {
      orders: { view: true, create: false, edit: false, delete: false },
    };
    expect(hasModulePermission(perms, 'accountant', 'orders', 'view')).toBe(true);
    expect(hasModulePermission(perms, 'accountant', 'orders', 'edit')).toBe(false);
  });

  it('falls back to role defaults when the map lacks the module', () => {
    expect(hasModulePermission(undefined, 'cashier', 'payment', 'create')).toBe(true);
    expect(hasModulePermission(undefined, 'cashier', 'payment', 'delete')).toBe(false);
  });

  it('falls back to the custom role when no role is given', () => {
    expect(hasModulePermission(undefined, undefined, 'dashboard', 'view')).toBe(true);
    expect(hasModulePermission(undefined, undefined, 'dashboard', 'edit')).toBe(false);
  });

  it('returns false for an unknown module', () => {
    expect(hasModulePermission(undefined, 'accountant', 'nonexistent', 'view')).toBe(false);
  });
});
