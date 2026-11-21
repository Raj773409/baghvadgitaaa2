import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  ALL_ADMIN_ROLES,
  getPermittedModules,
  hashPassword,
  hasModulePermission,
  signSessionToken,
  verifyPassword,
  verifyRazorpayPaymentSignature,
  verifySessionToken,
  verifyWebhookSignature,
} from './rbac.ts';

describe('server RBAC & security helpers', () => {
  it('enforces all 8 enterprise roles cleanly', () => {
    assert.equal(ALL_ADMIN_ROLES.length, 8);
    assert.equal(hasModulePermission('SUPER_ADMIN', 'users', 'write'), true);
    assert.equal(hasModulePermission('FINANCE_MANAGER', 'payments', 'write'), true);
    assert.equal(hasModulePermission('FINANCE_MANAGER', 'chapters', 'write'), false);
    assert.equal(hasModulePermission('AUDITOR', 'audit', 'read'), true);
    assert.equal(hasModulePermission('AUDITOR', 'audit', 'write'), false);
    assert.equal(hasModulePermission('AUDITOR', 'participants', 'write'), false);
    assert.equal(getPermittedModules('AUDITOR').write.length, 0);
  });

  it('hashes and verifies salted scrypt passwords securely', () => {
    const hash = hashPassword('EternalPass#2027');
    assert.equal(verifyPassword('EternalPass#2027', hash), true);
    assert.equal(verifyPassword('WrongPass', hash), false);
  });

  it('signs and verifies HMAC session tokens with expiry', () => {
    const secret = 'test-signing-secret-123';
    const token = signSessionToken(
      { userId: 'u-1', email: 'admin@eternal2027.org', role: 'EVENT_ADMIN' },
      secret,
      60_000,
    );
    const verified = verifySessionToken(token, secret);
    assert.equal(verified?.role, 'EVENT_ADMIN');
    assert.equal(verifySessionToken(`${token}tamper`, secret), null);
  });

  it('validates payment webhook HMAC signatures', () => {
    const payload = JSON.stringify({ event: 'payment.captured', amountInr: 1116 });
    const secret = 'whsec_test_987';
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    assert.equal(verifyWebhookSignature(payload, sig, secret), true);
    assert.equal(verifyWebhookSignature(payload, 'bad_sig', secret), false);
  });

  it('validates Razorpay order/payment checkout signatures with the key secret, not the webhook secret', () => {
    const keySecret = 'rzp_test_key_secret_123';
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const sig = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, sig, keySecret), true);
    assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, 'forged', keySecret), false);
    assert.equal(
      verifyRazorpayPaymentSignature(orderId, paymentId, sig, 'wrong-secret'),
      false,
    );
  });
});
