import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type http from 'node:http';
import express from 'express';
import { mountPlatformRoutes } from './routes.ts';

async function createTestServer() {
  // Tests must provision a deterministic bootstrap admin password explicitly: production
  // code no longer falls back to a predictable default when this env var is unset.
  if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'EternalAdmin#2027-Test';
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eternal-routes-test-'));
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as { rawBody?: string }).rawBody = buf.toString('utf8');
      },
    }),
  );

  mountPlatformRoutes(app, tmpDir, {
    getConfiguredApiKey: () => null,
    readDiskCachedWav: () => null,
    generateTtsWavWithResilience: async () => Buffer.alloc(0),
  });

  const server = await new Promise<http.Server>((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.once('error', reject);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to bind ephemeral port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    cleanup: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.();
        server.close(() => {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          resolve();
        });
      }),
  };
}

test('POST /api/public/registrations persists conditional fields & creates awaiting-gateway payment status', async () => {
  const srv = await createTestServer();
  try {
    const regRes = await fetch(`${srv.baseUrl}/api/public/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ananya Sharma',
        email: 'ananya@example.org',
        phone: '+91 98490 12345',
        noOfPersons: 4,
        donationAmount: 2100,
        registrationType: 'group',
        country: 'india',
        city: 'Hyderabad',
        preferredLanguage: 'te',
        familyOrGroupMembers: 'Rama, Sita, Krishna',
        organisationName: 'Vedanta Study Circle',
        parayanaCity: 'Hyderabad',
        assistanceNotes: 'Wheelchair seating needed; card 4111 2222 3333 4444 ignored',
        events: { curtainRaiser: true, mahotsav: true },
        assistance: { visa: false, accommodation: true, localTransport: false },
      }),
    });
    assert.equal(regRes.status, 201);
    const regJson = (await regRes.json()) as { ok: boolean; referenceCode: string };
    assert.equal(regJson.ok, true);
    assert.match(regJson.referenceCode, /^BVGM-/);

    const statusRes = await fetch(
      `${srv.baseUrl}/api/public/payments/${regJson.referenceCode}/status`,
    );
    assert.equal(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as {
      referenceCode: string;
      paymentStatus: string;
      receiptAvailable: boolean;
      amountInr: number;
    };
    assert.equal(statusJson.referenceCode, regJson.referenceCode);
    assert.equal(statusJson.paymentStatus, 'awaiting-gateway');
    assert.equal(statusJson.receiptAvailable, false);
    assert.equal(statusJson.amountInr, 2100);

    const orderRes = await fetch(`${srv.baseUrl}/api/public/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceCode: regJson.referenceCode }),
    });
    // Without Razorpay keys the server uses its built-in test gateway — never an external portal.
    assert.equal(orderRes.status, 201);
    const orderJson = (await orderRes.json()) as {
      configured: boolean;
      mode: string;
      status: string;
      testMode: boolean;
      orderId: string;
    };
    assert.equal(orderJson.mode, 'sandbox-checkout');
    assert.equal(orderJson.testMode, true);
    assert.match(orderJson.orderId, /^order_sbx_/);
    assert.equal(orderJson.status, 'awaiting-gateway');

    const missingStatus = await fetch(`${srv.baseUrl}/api/public/payments/BVGM-UNKNOWN/status`);
    assert.equal(missingStatus.status, 404);
  } finally {
    await srv.cleanup();
  }
});

test('Checkout → failed attempt → retry → passes, receipt, dashboard, login and QR verification', async () => {
  const srv = await createTestServer();
  try {
    const json = (body: unknown) => ({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const reg = (await (
      await fetch(
        `${srv.baseUrl}/api/public/registrations`,
        json({
          fullName: 'Simon Baler',
          email: 'simon@example.org',
          phone: '+91 98490 00000',
          noOfPersons: 2,
          donationAmount: 501,
          registrationType: 'individual',
          country: 'india',
          city: 'Hyderabad',
          events: { curtainRaiser: true, mahotsav: true },
          assistance: { visa: false, accommodation: false, localTransport: false },
        }),
      )
    ).json()) as { referenceCode: string };

    // 1. Dashboard is protected
    assert.equal((await fetch(`${srv.baseUrl}/api/portal/me`)).status, 401);

    // 2. First attempt is declined (UPI)
    const order1 = (await (
      await fetch(
        `${srv.baseUrl}/api/public/payments/create-order`,
        json({ referenceCode: reg.referenceCode, methodFamily: 'upi', methodProvider: 'gpay' }),
      )
    ).json()) as { orderId: string };
    const declined = await fetch(
      `${srv.baseUrl}/api/public/payments/sandbox/complete`,
      json({ orderId: order1.orderId, methodFamily: 'upi', methodProvider: 'gpay', outcome: 'failure' }),
    );
    assert.equal(declined.status, 402);

    // 3. Retry with a card succeeds; a full PAN in the label must be rejected/not stored
    const order2 = (await (
      await fetch(
        `${srv.baseUrl}/api/public/payments/create-order`,
        json({ referenceCode: reg.referenceCode, methodFamily: 'card', methodProvider: 'visa' }),
      )
    ).json()) as { orderId: string };
    const paidRes = await fetch(
      `${srv.baseUrl}/api/public/payments/sandbox/complete`,
      json({
        orderId: order2.orderId,
        methodFamily: 'card',
        methodProvider: 'visa',
        methodLabel: 'Visa •••• 4242',
        outcome: 'success',
      }),
    );
    assert.equal(paidRes.status, 200);
    const paid = (await paidRes.json()) as { status: string; receiptNumber: string; passesIssued: number };
    assert.equal(paid.status, 'paid');
    assert.match(paid.receiptNumber, /^BGVM-RCPT-\d{4}-\d{6}$/);
    assert.equal(paid.passesIssued, 2);
    const sessionCookie = (paidRes.headers.get('set-cookie') || '').split(';')[0];
    assert.match(sessionCookie, /^bgvm_portal_session=/);

    // 4. Paying again is refused
    const again = await fetch(
      `${srv.baseUrl}/api/public/payments/create-order`,
      json({ referenceCode: reg.referenceCode }),
    );
    assert.equal(again.status, 409);

    // 5. Dashboard shows passes, transactions, notifications, activity
    const me = (await (
      await fetch(`${srv.baseUrl}/api/portal/me`, { headers: { Cookie: sessionCookie } })
    ).json()) as {
      profile: { paymentStatus: string };
      payments: Array<{ id: string; status: string; methodLabel: string }>;
      passes: Array<{ qrPayload: string; admits: number; status: string }>;
      notifications: Array<{ title: string }>;
      activity: Array<{ label: string }>;
    };
    assert.equal(me.profile.paymentStatus, 'paid');
    assert.equal(me.payments[0].status, 'captured');
    assert.equal(me.payments[0].methodLabel, 'Visa •••• 4242');
    assert.equal(me.passes.length, 2);
    assert.equal(me.passes[0].admits, 2);
    assert.ok(me.notifications.some((n) => n.title === 'Payment successful'));
    assert.ok(me.notifications.some((n) => n.title === 'Payment not completed'));
    assert.ok(me.activity.some((a) => a.label === 'Payment captured'));

    // 6. Receipt
    const receipt = await fetch(`${srv.baseUrl}/api/portal/payments/${me.payments[0].id}/receipt`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(receipt.status, 200);

    // 7. QR pass verifies; a tampered one does not
    const ok = (await (
      await fetch(`${srv.baseUrl}/api/public/passes/verify`, json({ payload: me.passes[0].qrPayload }))
    ).json()) as { valid: boolean; admits: number };
    assert.equal(ok.valid, true);
    const tampered = me.passes[0].qrPayload.replace(/.$/, (c) => (c === '0' ? '1' : '0'));
    const bad = (await (
      await fetch(`${srv.baseUrl}/api/public/passes/verify`, json({ payload: tampered }))
    ).json()) as { valid: boolean };
    assert.equal(bad.valid, false);

    // 8. Login needs BOTH email and reference
    assert.equal(
      (await fetch(`${srv.baseUrl}/api/portal/login`, json({ email: 'simon@example.org', referenceCode: 'BVGM-000000' }))).status,
      401,
    );
    const login = await fetch(
      `${srv.baseUrl}/api/portal/login`,
      json({ email: 'SIMON@example.org', referenceCode: reg.referenceCode.toLowerCase() }),
    );
    assert.equal(login.status, 200);

    // 9. Profile update validates and persists
    const badPhone = await fetch(`${srv.baseUrl}/api/portal/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ phone: 'call me' }),
    });
    assert.equal(badPhone.status, 400);
    const goodProfile = (await (
      await fetch(`${srv.baseUrl}/api/portal/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ city: 'Tirupati', phone: '+91 90000 11111' }),
      })
    ).json()) as { profile: { city: string; phone: string } };
    assert.equal(goodProfile.profile.city, 'Tirupati');
  } finally {
    await srv.cleanup();
  }
});

test('POST /api/voice/parse-registration parses valid fields and blocks sensitive card/OTP tokens', async () => {
  const srv = await createTestServer();
  try {
    const okRes = await fetch(`${srv.baseUrl}/api/voice/parse-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utterance: 'My name is Karthik Reddy, email karthik@example.org, from Hyderabad India',
        step: 3,
        locale: 'en',
        currentValues: {},
      }),
    });
    assert.equal(okRes.status, 200);
    const okJson = (await okRes.json()) as {
      sensitiveBlocked: boolean;
      needsEmailPhoneConfirmation: boolean;
      updates: { fullName?: string; email?: string; city?: string; country?: string };
    };
    assert.equal(okJson.sensitiveBlocked, false);
    assert.equal(okJson.needsEmailPhoneConfirmation, true);
    assert.equal(okJson.updates.fullName, 'Karthik Reddy');
    assert.equal(okJson.updates.email, 'karthik@example.org');
    assert.equal(okJson.updates.city, 'Hyderabad');
    assert.equal(okJson.updates.country, 'india');

    const blockedRes = await fetch(`${srv.baseUrl}/api/voice/parse-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utterance: 'Here is my OTP 492012 and UPI PIN 8821',
        step: 8,
        locale: 'en',
        currentValues: {},
      }),
    });
    assert.equal(blockedRes.status, 200);
    const blockedJson = (await blockedRes.json()) as {
      sensitiveBlocked: boolean;
      updates: Record<string, unknown>;
    };
    assert.equal(blockedJson.sensitiveBlocked, true);
    assert.deepEqual(blockedJson.updates, {});
  } finally {
    await srv.cleanup();
  }
});

test('Admin login sets secure session cookie, enforces RBAC 403 boundaries, and revokes token on logout', async () => {
  const srv = await createTestServer();
  try {
    // 1. Unauthenticated access must fail with 401
    const unauthDash = await fetch(`${srv.baseUrl}/api/admin/dashboard`);
    assert.equal(unauthDash.status, 401);

    // 2. Invalid credentials rejected with 401
    const badLogin = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eternal2027.org', password: 'WrongPassword123' }),
    });
    assert.equal(badLogin.status, 401);

    // 3. Valid SUPER_ADMIN login over forwarded HTTPS returns SameSite=None; Secure cookie
    const loginRes = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Proto': 'https',
      },
      body: JSON.stringify({
        email: 'admin@eternal2027.org',
        password: process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || 'EternalAdmin#2027',
      }),
    });
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get('set-cookie') || '';
    assert.match(setCookie, /eternal_admin_session=/);
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=None/);
    assert.match(setCookie, /Secure/);
    const cookiePair = setCookie.split(';')[0];

    // 4. Session persists across subsequent requests with cookie
    const sessionRes = await fetch(`${srv.baseUrl}/api/admin/session`, {
      headers: { Cookie: cookiePair },
    });
    assert.equal(sessionRes.status, 200);
    const sessionJson = (await sessionRes.json()) as {
      authenticated: boolean;
      user: { role: string };
      permissions: { read: string[] };
    };
    assert.equal(sessionJson.authenticated, true);
    assert.equal(sessionJson.user.role, 'SUPER_ADMIN');
    assert.ok(sessionJson.permissions.read.includes('users'));

    // 5. Provision a FINANCE_MANAGER account and verify strict RBAC enforcement
    const createUserRes = await fetch(`${srv.baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        name: 'Treasury Officer',
        email: 'finance@eternal2027.org',
        password: 'FinancePass#2027',
        role: 'FINANCE_MANAGER',
      }),
    });
    assert.equal(createUserRes.status, 201);

    const financeLoginRes = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'finance@eternal2027.org',
        password: 'FinancePass#2027',
      }),
    });
    assert.equal(financeLoginRes.status, 200);
    const financeCookie = (financeLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // Finance role CAN read payments, CANNOT read users, media, or chapters CMS
    const financePayments = await fetch(`${srv.baseUrl}/api/admin/payments`, {
      headers: { Cookie: financeCookie },
    });
    assert.equal(financePayments.status, 200);

    const financeUsers = await fetch(`${srv.baseUrl}/api/admin/users`, {
      headers: { Cookie: financeCookie },
    });
    assert.equal(financeUsers.status, 403);

    const financeMedia = await fetch(`${srv.baseUrl}/api/admin/media`, {
      headers: { Cookie: financeCookie },
    });
    assert.equal(financeMedia.status, 403);

    const financeChaptersCms = await fetch(`${srv.baseUrl}/api/admin/cms?section=chapters`, {
      headers: { Cookie: financeCookie },
    });
    assert.equal(financeChaptersCms.status, 403);

    // 6. Logout revokes token immediately server-side (replaying old cookie fails)
    const logoutRes = await fetch(`${srv.baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Cookie: cookiePair },
    });
    assert.equal(logoutRes.status, 200);

    const replayedSession = await fetch(`${srv.baseUrl}/api/admin/session`, {
      headers: { Cookie: cookiePair },
    });
    const replayedJson = (await replayedSession.json()) as { authenticated: boolean };
    assert.equal(replayedJson.authenticated, false);

    const replayedDash = await fetch(`${srv.baseUrl}/api/admin/dashboard`, {
      headers: { Cookie: cookiePair },
    });
    assert.equal(replayedDash.status, 401);

    // 7. Cookie-blocked iframe flow: login with pasted trailing space returns Bearer sessionToken
    const bearerLoginRes = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ' admin@eternal2027.org ',
        password: `${process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || 'EternalAdmin#2027'} `,
      }),
    });
    assert.equal(bearerLoginRes.status, 200);
    const bearerLoginJson = (await bearerLoginRes.json()) as {
      authenticated: boolean;
      sessionToken?: string;
    };
    assert.equal(bearerLoginJson.authenticated, true);
    assert.ok(bearerLoginJson.sessionToken && bearerLoginJson.sessionToken.length > 20);

    // Works across /api/admin/session & /api/admin/dashboard without Cookie header
    const bearerDash = await fetch(`${srv.baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${bearerLoginJson.sessionToken}` },
    });
    assert.equal(bearerDash.status, 200);

    // Logout via Bearer token revokes it immediately
    const bearerLogout = await fetch(`${srv.baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearerLoginJson.sessionToken}` },
    });
    assert.equal(bearerLogout.status, 200);

    const revokedBearerDash = await fetch(`${srv.baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${bearerLoginJson.sessionToken}` },
    });
    assert.equal(revokedBearerDash.status, 401);
  } finally {
    await srv.cleanup();
  }
});

test('Website CMS enforces draft/publish isolation, revision rollback, carousel publish, media replacement, and FINANCE_MANAGER 403', async () => {
  const srv = await createTestServer();
  try {
    // 1. Authenticate SUPER_ADMIN and create FINANCE_MANAGER to verify strict 403 on new CMS routes
    const adminLogin = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eternal2027.org',
        password: process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || 'EternalAdmin#2027',
      }),
    });
    const adminJson = (await adminLogin.json()) as { sessionToken: string };
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJson.sessionToken}`,
    };

    await fetch(`${srv.baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Treasury',
        email: 'treasury@eternal2027.org',
        password: 'TreasuryPass#2027',
        role: 'FINANCE_MANAGER',
      }),
    });
    const finLogin = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'treasury@eternal2027.org', password: 'TreasuryPass#2027' }),
    });
    const finJson = (await finLogin.json()) as { sessionToken: string };
    const finPagesRes = await fetch(`${srv.baseUrl}/api/admin/pages`, {
      headers: { Authorization: `Bearer ${finJson.sessionToken}` },
    });
    assert.equal(finPagesRes.status, 403);
    const finCarouselsRes = await fetch(`${srv.baseUrl}/api/admin/carousels`, {
      headers: { Authorization: `Bearer ${finJson.sessionToken}` },
    });
    assert.equal(finCarouselsRes.status, 403);

    // 2. Verify all 28 canonical pages exist
    const pagesRes = await fetch(`${srv.baseUrl}/api/admin/pages`, { headers: authHeaders });
    assert.equal(pagesRes.status, 200);
    const pagesData = (await pagesRes.json()) as {
      pages: Array<{
        id: string;
        route: string;
        publishedVersion: { title: { en: string }; subtitle: { en: string }; summary: { en: string }; seo: { metaTitle: string; metaDescription: string }; blocks: unknown[] };
      }>;
    };
    assert.equal(pagesData.pages.length, 28);
    const aboutPage = pagesData.pages.find((p) => p.route === '/about');
    assert.ok(aboutPage);
    const originalTitle = aboutPage.publishedVersion.title.en;

    // 3. Save Draft -> must NOT appear on public /api/public/cms!
    const draftSnapshot = {
      ...aboutPage.publishedVersion,
      title: { en: 'STAGED SECRET DRAFT ABOUT' },
    };
    const saveDraftRes = await fetch(`${srv.baseUrl}/api/admin/pages/${aboutPage.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ mode: 'draft', snapshot: draftSnapshot }),
    });
    assert.equal(saveDraftRes.status, 200);

    const publicAfterDraft = (await (await fetch(`${srv.baseUrl}/api/public/cms`)).json()) as {
      pages: Array<{ id: string; publishedVersion: { title: { en: string } }; draftVersion?: unknown }>;
    };
    const publicAboutDraftCheck = publicAfterDraft.pages.find((p) => p.id === aboutPage.id);
    assert.ok(publicAboutDraftCheck);
    assert.equal(publicAboutDraftCheck.publishedVersion.title.en, originalTitle);
    assert.equal(publicAboutDraftCheck.draftVersion, undefined);

    // 4. Publish Changes -> MUST appear on public /api/public/cms
    const publishSnapshot = {
      ...aboutPage.publishedVersion,
      title: { en: 'Published Mahotsav 2027 Stewardship' },
    };
    const publishRes = await fetch(`${srv.baseUrl}/api/admin/pages/${aboutPage.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ mode: 'publish', snapshot: publishSnapshot }),
    });
    assert.equal(publishRes.status, 200);

    const publicAfterPublish = (await (await fetch(`${srv.baseUrl}/api/public/cms`)).json()) as {
      pages: Array<{ id: string; publishedVersion: { title: { en: string } } }>;
    };
    assert.equal(
      publicAfterPublish.pages.find((p) => p.id === aboutPage.id)?.publishedVersion.title.en,
      'Published Mahotsav 2027 Stewardship',
    );

    // 5. Rollback via revision restore -> MUST revert public title to originalTitle
    const revRes = await fetch(`${srv.baseUrl}/api/admin/revisions?entityId=${aboutPage.id}`, {
      headers: authHeaders,
    });
    const revJson = (await revRes.json()) as {
      revisions: Array<{ id: string; action: string }>;
    };
    const publishRev = revJson.revisions.find((r) => r.action === 'publish');
    assert.ok(publishRev);

    const restoreRes = await fetch(`${srv.baseUrl}/api/admin/revisions/${publishRev.id}/restore`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(restoreRes.status, 200);

    const publicAfterRestore = (await (await fetch(`${srv.baseUrl}/api/public/cms`)).json()) as {
      pages: Array<{ id: string; publishedVersion: { title: { en: string } } }>;
    };
    assert.equal(
      publicAfterRestore.pages.find((p) => p.id === aboutPage.id)?.publishedVersion.title.en,
      originalTitle,
    );

    // 6. Carousel publish & media asset replacement propagation
    const carouselsRes = await fetch(`${srv.baseUrl}/api/admin/carousels`, { headers: authHeaders });
    const carouselsJson = (await carouselsRes.json()) as {
      carousels: Array<{ id: string; publishedSlides: Array<{ id: string; caption?: string; title: string; subtitle: string; alt: string; src: string; order: number; enabled: boolean }> }>;
    };
    const spiritualCarousel = carouselsJson.carousels.find((c) => c.id === 'hero-spiritual');
    assert.ok(spiritualCarousel);
    const updatedSlides = spiritualCarousel.publishedSlides.map((s, idx) =>
      idx === 0 ? { ...s, caption: 'Live Updated Spiritual Caption.' } : s,
    );
    const putCarouselRes = await fetch(`${srv.baseUrl}/api/admin/carousels/hero-spiritual`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ mode: 'publish', slides: updatedSlides, autoAdvanceMs: 6000 }),
    });
    assert.equal(putCarouselRes.status, 200);

    const assetsRes = await fetch(`${srv.baseUrl}/api/admin/media-assets`, { headers: authHeaders });
    const assetsJson = (await assetsRes.json()) as {
      assets: Array<{ id: string; assetKey?: string; usageLocations: string[] }>;
    };
    const krishnaAsset = assetsJson.assets.find((a) => a.assetKey === 'lordKrishnaPortrait');
    assert.ok(krishnaAsset);
    assert.ok(krishnaAsset.usageLocations.some((loc) => loc.includes('Spiritual')));

    const replaceRes = await fetch(`${srv.baseUrl}/api/admin/media-assets/${krishnaAsset.id}/replace`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        url: '/uploads/test-replacement-krishna.png',
        altText: 'Replaced Krishna Artwork',
      }),
    });
    assert.equal(replaceRes.status, 200);
    const replaceJson = (await replaceRes.json()) as {
      propagation: { updatedSlidesCount: number };
    };
    assert.ok(replaceJson.propagation.updatedSlidesCount >= 1);

    // 7. Sync-all creates backup & GLB inspector returns clean status
    const syncRes = await fetch(`${srv.baseUrl}/api/admin/pages/sync-all`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(syncRes.status, 200);
    const syncJson = (await syncRes.json()) as { ok: boolean; totalPages: number; backup: { fileName: string } };
    assert.equal(syncJson.ok, true);
    assert.equal(syncJson.totalPages, 28);
    assert.ok(syncJson.backup.fileName.startsWith('backup-'));

    const glbRes = await fetch(`${srv.baseUrl}/api/admin/story/inspect-glbs`, {
      headers: authHeaders,
    });
    assert.equal(glbRes.status, 200);
  } finally {
    await srv.cleanup();
  }
});

test('Password rotation locks admin routes until change-password is completed', async () => {
  const srv = await createTestServer();
  try {
    const loginRes = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eternal2027.org',
        password: process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || 'EternalAdmin#2027',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = (await loginRes.json()) as { sessionToken: string };
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginJson.sessionToken}`,
    };

    const dashBeforeRotation = await fetch(`${srv.baseUrl}/api/admin/dashboard`, {
      headers: authHeaders,
    });
    assert.equal(dashBeforeRotation.status, 200);

    // An administrator resets this account's password; the account must be forced to set its
    // own permanent password before it can use any admin route again.
    const rotateRes = await fetch(`${srv.baseUrl}/api/admin/users/usr-super-1`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ password: 'RotatedBySuperAdmin#1' }),
    });
    assert.equal(rotateRes.status, 200);

    const dashLocked = await fetch(`${srv.baseUrl}/api/admin/dashboard`, { headers: authHeaders });
    assert.equal(dashLocked.status, 403);
    const dashLockedJson = (await dashLocked.json()) as { code?: string };
    assert.equal(dashLockedJson.code, 'PASSWORD_CHANGE_REQUIRED');

    // Session/logout/change-password must remain reachable while locked.
    const sessionWhileLocked = await fetch(`${srv.baseUrl}/api/admin/session`, {
      headers: authHeaders,
    });
    const sessionWhileLockedJson = (await sessionWhileLocked.json()) as {
      authenticated: boolean;
      user?: { mustChangePassword?: boolean };
    };
    assert.equal(sessionWhileLockedJson.authenticated, true);
    assert.equal(sessionWhileLockedJson.user?.mustChangePassword, true);

    const wrongCurrentPassword = await fetch(`${srv.baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        currentPassword: 'definitely-wrong',
        newPassword: 'A-New-Permanent-Password#99',
      }),
    });
    assert.equal(wrongCurrentPassword.status, 401);

    const changeRes = await fetch(`${srv.baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        currentPassword: 'RotatedBySuperAdmin#1',
        newPassword: 'A-New-Permanent-Password#99',
      }),
    });
    assert.equal(changeRes.status, 200);

    const dashAfterChange = await fetch(`${srv.baseUrl}/api/admin/dashboard`, {
      headers: authHeaders,
    });
    assert.equal(dashAfterChange.status, 200);
  } finally {
    await srv.cleanup();
  }
});

test('Payment webhook verifies HMAC signatures, rejects forged ones, and deduplicates retried deliveries', async () => {
  const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  process.env.PAYMENT_WEBHOOK_SECRET = 'whsec_test_integration_secret';
  const srv = await createTestServer();
  try {
    const regRes = await fetch(`${srv.baseUrl}/api/public/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Rao',
        email: 'vikram@example.org',
        phone: '+91 90000 11111',
        noOfPersons: 1,
        donationAmount: 500,
        registrationType: 'individual',
        country: 'india',
        city: 'Vijayawada',
        events: { curtainRaiser: true, mahotsav: true },
        assistance: { visa: false, accommodation: false, localTransport: false },
      }),
    });
    const regJson = (await regRes.json()) as { referenceCode: string };
    const secret = process.env.PAYMENT_WEBHOOK_SECRET!;

    const bodyObj = { referenceCode: regJson.referenceCode, status: 'captured' };
    const rawBody = JSON.stringify(bodyObj);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const forgedRes = await fetch(`${srv.baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': 'forged-signature' },
      body: rawBody,
    });
    assert.equal(forgedRes.status, 401);

    const firstRes = await fetch(`${srv.baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signature },
      body: rawBody,
    });
    assert.equal(firstRes.status, 200);
    const firstJson = (await firstRes.json()) as { ok: boolean; matched: boolean; deduplicated?: boolean };
    assert.equal(firstJson.ok, true);
    assert.equal(firstJson.matched, true);
    assert.notEqual(firstJson.deduplicated, true);

    const statusAfterFirst = await fetch(
      `${srv.baseUrl}/api/public/payments/${regJson.referenceCode}/status`,
    );
    const statusAfterFirstJson = (await statusAfterFirst.json()) as { paymentStatus: string };
    assert.equal(statusAfterFirstJson.paymentStatus, 'paid');

    // Gateways retry identical deliveries; replaying the exact same body+signature must be
    // deduplicated rather than reprocessed.
    const retryRes = await fetch(`${srv.baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signature },
      body: rawBody,
    });
    assert.equal(retryRes.status, 200);
    const retryJson = (await retryRes.json()) as { ok: boolean; deduplicated?: boolean };
    assert.equal(retryJson.ok, true);
    assert.equal(retryJson.deduplicated, true);

    // A distinct body (refund) is a different event and must be processed normally.
    const refundBodyObj = { referenceCode: regJson.referenceCode, status: 'refunded' };
    const refundRawBody = JSON.stringify(refundBodyObj);
    const refundSignature = crypto
      .createHmac('sha256', secret)
      .update(refundRawBody)
      .digest('hex');
    const refundRes = await fetch(`${srv.baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': refundSignature },
      body: refundRawBody,
    });
    assert.equal(refundRes.status, 200);

    const statusAfterRefund = await fetch(
      `${srv.baseUrl}/api/public/payments/${regJson.referenceCode}/status`,
    );
    const statusAfterRefundJson = (await statusAfterRefund.json()) as { paymentStatus: string };
    assert.equal(statusAfterRefundJson.paymentStatus, 'refunded');
  } finally {
    await srv.cleanup();
    if (originalSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
    else process.env.PAYMENT_WEBHOOK_SECRET = originalSecret;
  }
});
