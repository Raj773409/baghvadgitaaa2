import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PlatformStore,
  createInitialDatabase,
  serializeRecordsToCsv,
  serializeRecordsToExcelXml,
} from './store.ts';
import { verifyPassword } from './rbac.ts';

describe('PlatformStore & exports', () => {
  it('starts with honest empty participant/payment counts and persists records atomically', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eternal-store-'));
    try {
      const store = new PlatformStore(tmpDir);
      const db = store.getSnapshot();
      assert.equal(db.participants.length, 0);
      assert.equal(db.payments.length, 0);
      assert.equal(db.users.length, 1);

      db.participants.push({
        id: 'reg-1',
        fullName: 'Ananya Sharma',
        email: 'ananya@example.org',
        phone: '+91 9876543210',
        noOfPersons: 2,
        donationAmountInr: 1116,
        registrationType: 'family',
        country: 'India',
        city: 'Hyderabad',
        assistance: { visa: false, accommodation: true, localTransport: false },
        events: { curtainRaiser: true, mahotsav: true },
        verificationStatus: 'pending',
        paymentStatus: 'awaiting-gateway',
        referenceCode: 'EGM-2027-001',
        createdAt: new Date().toISOString(),
      });
      store.save();

      // Reloading an existing store with a real admin user already on disk must NOT mint
      // (and print) a brand-new throwaway bootstrap password on every ordinary restart.
      const originalWarn = console.warn;
      const warnCalls: unknown[][] = [];
      console.warn = (...args: unknown[]) => warnCalls.push(args);
      let reloaded: PlatformStore;
      try {
        reloaded = new PlatformStore(tmpDir);
      } finally {
        console.warn = originalWarn;
      }
      assert.equal(warnCalls.length, 0);
      assert.equal(reloaded.getSnapshot().users[0].passwordHash, db.users[0].passwordHash);
      assert.equal(reloaded.getSnapshot().participants.length, 1);
      assert.equal(reloaded.getSnapshot().participants[0].fullName, 'Ananya Sharma');

      const backup = reloaded.createBackup();
      assert.ok(backup.sizeBytes > 100);
      assert.equal(reloaded.listBackups().length, 1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('escapes formula injection cleanly in CSV and outputs valid SpreadsheetML Excel XML', () => {
    const csv = serializeRecordsToCsv(['Name', 'Amount'], [['=CMD()', 1116]]);
    assert.ok(csv.includes(`"'=CMD()"`));

    const xls = serializeRecordsToExcelXml('Participants', ['Name', 'Amount'], [['Arjuna', 2500]]);
    assert.ok(xls.includes('<Workbook'));
    assert.ok(xls.includes('ss:Type="Number">2500'));
  });

  it('never provisions the retired default bootstrap password when none is configured', () => {
    const originalEnv = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
    try {
      const db = createInitialDatabase();
      const superAdmin = db.users[0];
      assert.equal(superAdmin.role, 'SUPER_ADMIN');
      assert.equal(superAdmin.mustChangePassword, true);
      // The historical default password must never again unlock a freshly bootstrapped account.
      assert.equal(verifyPassword('EternalAdmin#2027', superAdmin.passwordHash), false);
    } finally {
      if (originalEnv === undefined) delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
      else process.env.ADMIN_BOOTSTRAP_PASSWORD = originalEnv;
    }
  });

  it('does not force a password change when an explicit bootstrap password is configured', () => {
    const db = createInitialDatabase('A-Real-Operator-Chosen-Password#1');
    const superAdmin = db.users[0];
    assert.equal(superAdmin.mustChangePassword, false);
    assert.equal(
      verifyPassword('A-Real-Operator-Chosen-Password#1', superAdmin.passwordHash),
      true,
    );
  });
});
