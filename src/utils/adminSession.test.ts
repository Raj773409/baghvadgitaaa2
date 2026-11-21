import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminHeaders,
  clearAdminSessionToken,
  extractDownloadFilename,
  getAdminSessionToken,
  setAdminSessionToken,
} from './adminSession';

test('adminSession token lifecycle manages memory token cleanly', () => {
  clearAdminSessionToken();
  assert.equal(getAdminSessionToken(), null);

  setAdminSessionToken('  tok_abc_123  ');
  assert.equal(getAdminSessionToken(), 'tok_abc_123');

  const headers = buildAdminHeaders({ 'Content-Type': 'application/json' });
  assert.equal(headers.get('Authorization'), 'Bearer tok_abc_123');
  assert.equal(headers.get('Content-Type'), 'application/json');

  // Preserve explicit Authorization header if provided
  const custom = buildAdminHeaders({ Authorization: 'Bearer override_tok' });
  assert.equal(custom.get('Authorization'), 'Bearer override_tok');

  clearAdminSessionToken();
  assert.equal(getAdminSessionToken(), null);
  const emptyHeaders = buildAdminHeaders();
  assert.equal(emptyHeaders.get('Authorization'), null);
});

test('extractDownloadFilename parses Content-Disposition or falls back cleanly', () => {
  assert.equal(
    extractDownloadFilename('attachment; filename="participants-export.csv"', 'fallback.csv'),
    'participants-export.csv',
  );
  assert.equal(
    extractDownloadFilename('attachment; filename*=UTF-8\'\'report-2027.xls', 'fallback.xls'),
    'report-2027.xls',
  );
  assert.equal(extractDownloadFilename(null, 'fallback.csv'), 'fallback.csv');
});
