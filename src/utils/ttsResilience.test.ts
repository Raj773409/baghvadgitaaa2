import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGeminiQuotaError,
  TTS_MODEL_PRIORITY,
  TtsModelCircuitBreaker,
} from './ttsResilience';

test('parseGeminiQuotaError detects 429 RESOURCE_EXHAUSTED daily quota and retryDelay', () => {
  const raw = JSON.stringify({
    error: {
      code: 429,
      message: 'Quota exceeded for metric: generate_content_free_tier_requests, limit: 10. Please retry in 15h12.284688767s.',
      status: 'RESOURCE_EXHAUSTED',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [
            {
              quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
              quotaDimensions: { model: 'gemini-3.8-flash-lite-tts' },
            },
          ],
        },
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: '54012s',
        },
      ],
    },
  });

  const parsed = parseGeminiQuotaError(new Error(raw));
  assert.equal(parsed.isQuotaExceeded, true);
  assert.equal(parsed.isTransientRateLimit, false);
  assert.equal(parsed.retryAfterSeconds, 54012);
});

test('parseGeminiQuotaError distinguishes transient burst 429 from daily exhaustion', () => {
  const parsed = parseGeminiQuotaError(
    new Error('429 RESOURCE_EXHAUSTED: Please retry in 4s.'),
  );
  assert.equal(parsed.isQuotaExceeded, true);
  assert.equal(parsed.isTransientRateLimit, true);
  assert.equal(parsed.retryAfterSeconds, 4);
});

test('TtsModelCircuitBreaker falls back to secondary TTS model and blocks exhausted models', () => {
  const breaker = new TtsModelCircuitBreaker();
  const t0 = 1_000_000;

  assert.deepEqual(breaker.getAvailableModels(TTS_MODEL_PRIORITY, t0), [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
  ]);

  // First trip on primary returns true for one-time warning log
  assert.equal(breaker.tripCooldown('gemini-3.8-flash-lite-tts', 54000, t0), true);
  // Subsequent trip in same window returns false to avoid log spam
  assert.equal(breaker.tripCooldown('gemini-3.8-flash-lite-tts', 54000, t0 + 1000), false);

  assert.deepEqual(breaker.getAvailableModels(TTS_MODEL_PRIORITY, t0 + 2000), [
    'gemini-3.8-flash-tts',
  ]);

  breaker.tripCooldown('gemini-3.8-flash-tts', 120, t0 + 2000);
  assert.deepEqual(breaker.getAvailableModels(TTS_MODEL_PRIORITY, t0 + 3000), []);
  assert.ok(breaker.getMaxRemainingCooldownSeconds(TTS_MODEL_PRIORITY, t0 + 3000) >= 119);
});
