export const TTS_MODEL_PRIORITY = [
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
] as const;

export type TtsModelId = (typeof TTS_MODEL_PRIORITY)[number];

export interface ParsedQuotaError {
  isQuotaExceeded: boolean;
  isTransientRateLimit: boolean;
  retryAfterSeconds: number;
  rawMessage: string;
}

/**
 * Inspects Gemini API errors (including serialized JSON messages from @google/genai)
 * to determine if a 429 RESOURCE_EXHAUSTED / quota limit occurred and extract retryDelay.
 */
export function parseGeminiQuotaError(err: unknown): ParsedQuotaError {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err ?? '');

  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : NaN;

  const isQuotaExceeded =
    status === 429 ||
    /RESOURCE_EXHAUSTED|quota exceeded|"code"\s*:\s*429/i.test(rawMessage);

  let retryAfterSeconds = 0;

  // Match structured RetryInfo ("retryDelay":"54012s")
  const retryDelayJsonMatch = rawMessage.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (retryDelayJsonMatch) {
    retryAfterSeconds = Math.ceil(Number(retryDelayJsonMatch[1]));
  } else {
    // Match human readable text ("Please retry in 15h12.28s." or "retry in 45s")
    const hoursMinSecMatch = rawMessage.match(
      /retry in\s+(?:(\d+)h)?(?:(\d+)m)?(\d+(?:\.\d+)?)s/i,
    );
    if (hoursMinSecMatch) {
      const h = Number(hoursMinSecMatch[1] ?? 0);
      const m = Number(hoursMinSecMatch[2] ?? 0);
      const s = Number(hoursMinSecMatch[3] ?? 0);
      retryAfterSeconds = Math.ceil(h * 3600 + m * 60 + s);
    }
  }

  const isDailyExhaustion =
    /PerDay|GenerateRequestsPerDay/i.test(rawMessage) || retryAfterSeconds > 30;
  const isTransientRateLimit =
    isQuotaExceeded && !isDailyExhaustion && retryAfterSeconds > 0 && retryAfterSeconds <= 15;

  if (isQuotaExceeded && retryAfterSeconds <= 0) {
    retryAfterSeconds = 60;
  }

  return {
    isQuotaExceeded,
    isTransientRateLimit,
    retryAfterSeconds,
    rawMessage,
  };
}

export class TtsQuotaExceededError extends Error {
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message?: string) {
    super(
      message ??
        'Daily text-to-speech API quota reached; accessible text narration remains active.',
    );
    this.name = 'TtsQuotaExceededError';
    this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
  }
}

/**
 * Per-model cooldown tracker preventing repeated calls against quota-exhausted TTS models.
 */
export class TtsModelCircuitBreaker {
  private readonly cooldownUntil = new Map<string, number>();
  private readonly loggedCooldownTrips = new Set<string>();

  public getAvailableModels(
    models: ReadonlyArray<string> = TTS_MODEL_PRIORITY,
    nowMs = Date.now(),
  ): string[] {
    return models.filter((m) => (this.cooldownUntil.get(m) ?? 0) <= nowMs);
  }

  /**
   * Places a model on cooldown (capped at 1 hour so runtime env/billing changes recover naturally).
   * Returns true if this was the first trip for the current cooldown window (for one-time logging).
   */
  public tripCooldown(
    model: string,
    retryAfterSeconds: number,
    nowMs = Date.now(),
  ): boolean {
    const cappedMs = Math.min(Math.max(15, retryAfterSeconds) * 1000, 60 * 60 * 1000);
    const wasActive = (this.cooldownUntil.get(model) ?? 0) > nowMs;
    this.cooldownUntil.set(model, nowMs + cappedMs);
    if (!wasActive && !this.loggedCooldownTrips.has(model)) {
      this.loggedCooldownTrips.add(model);
      return true;
    }
    return false;
  }

  public getMaxRemainingCooldownSeconds(
    models: ReadonlyArray<string> = TTS_MODEL_PRIORITY,
    nowMs = Date.now(),
  ): number {
    let maxMs = 0;
    for (const m of models) {
      const remaining = (this.cooldownUntil.get(m) ?? 0) - nowMs;
      if (remaining > maxMs) maxMs = remaining;
    }
    return Math.max(1, Math.ceil(maxMs / 1000));
  }

  public reset(): void {
    this.cooldownUntil.clear();
    this.loggedCooldownTrips.clear();
  }
}
