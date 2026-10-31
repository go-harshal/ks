import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const permissions = require('../../api/src/config/permissions.js');

test.describe('security regression checks', () => {
  test('a stale users.manage grant cannot grant user administration to an admin', () => {
    expect(permissions.GRANTABLE).not.toContain('users.manage');
    const admin = { role: 'admin', grants: ['users.manage', 'settings.manage'] };
    expect(permissions.permsFor(admin)).not.toContain('users.manage');
    expect(permissions.can(admin, 'users.manage')).toBe(false);
  });

  test('only the Super Admin role receives wildcard permissions', () => {
    expect(permissions.can({ role: 'super_admin', grants: [] }, 'users.manage')).toBe(true);
    expect(permissions.can({ role: 'team_member', grants: ['users.manage'] }, 'users.manage')).toBe(false);
  });

  test('unauthenticated requests cannot access admin user-management endpoints', async ({ request }) => {
    const api = await request.newContext({ baseURL: process.env.API_BASE_URL || 'http://127.0.0.1:8001' });
    try {
      const response = await api.get('/api/v1/admin/users');
      expect([401, 403]).toContain(response.status());
    } finally {
      await api.dispose();
    }
  });

  test('TOTP encryption round-trips and rejects modified ciphertext', async () => {
    process.env.MONGO_URL ||= 'mongodb://127.0.0.1:27017/ks_test';
    process.env.MONGO_DB ||= 'ks_test';
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const service = require('../../api/src/modules/auth/service.js');
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const encrypted = service.encryptTwoFactorSecret(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(service.decryptTwoFactorSecret(encrypted)).toBe(plaintext);
    const tampered = encrypted.slice(0, -1) + (encrypted.endsWith('A') ? 'B' : 'A');
    expect(() => service.decryptTwoFactorSecret(tampered)).toThrow();
  });

  test('file uploads fail closed when the malware scanner is not configured', async () => {
    const previous = process.env.CLAMAV_HOST;
    delete process.env.CLAMAV_HOST;
    try {
      const scanner = require('../../api/src/providers/malwareScanner.js');
      await expect(scanner.scanBuffer(Buffer.from('harmless test fixture'))).rejects.toMatchObject({
        status: 503,
        code: 'MALWARE_SCANNER_UNAVAILABLE',
      });
    } finally {
      if (previous === undefined) delete process.env.CLAMAV_HOST;
      else process.env.CLAMAV_HOST = previous;
    }
  });
});
