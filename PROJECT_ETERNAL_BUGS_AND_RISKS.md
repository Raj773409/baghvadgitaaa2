# PROJECT ETERNAL — BUGS, SECURITY RISKS, AND LIMITATIONS

Verified bugs, security findings (severity-ranked), and explicitly flagged untested/unverifiable areas. No secrets, credential values, or private user information are printed anywhere in this document — only variable names and, where unavoidable for the severity of the finding, one literal default string that already ships in the public test suite (see C1).

---

## Part A — Security Findings (severity-ranked)

### CRITICAL

**C1 — Hard-coded default SUPER_ADMIN credentials ship in source and auto-provision on first boot** `server/store.ts`
```
adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@eternal2027.org'
adminPass  = bootstrapPassword || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'EternalAdmin#2027'
```
If `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` are not explicitly set — they are commented out in `.env.example` and **this checkout ships with no override** — the very first server boot silently provisions `admin@eternal2027.org` / `EternalAdmin#2027` as a `SUPER_ADMIN` (wildcard `*` read+write on every module). This exact literal string is also hard-coded in `server/routes.test.ts`, meaning it is effectively public.
**Exploit scenario:** an attacker POSTs these literal, publicly-known credentials to `/api/admin/login` on any deployment that forgot to override the bootstrap env vars, and gets full control of participant PII, payment/refund ledgers, and user management.
**Fix (not implemented in this audit):** refuse to boot in any non-test environment unless `ADMIN_BOOTSTRAP_PASSWORD` is explicitly set to a non-default value, or force a mandatory password reset on the very first login of the bootstrap account.

### HIGH

**H1 — No rate limiting on any public, cost-bearing, or data-mutating endpoint except admin login**
The 12-attempts/10-minutes login throttle is the **only** rate limit in the entire application. Fully unthrottled: `/api/public/registrations`, `/api/public/volunteers`, `/api/voice/synthesize`, `/api/voice/parse-registration`, `/api/chapters/:chapter/recitation`, `/api/story/:scene/narration`, `/api/welcome/narration`. The TTS routes call paid Gemini models keyed by arbitrary client-supplied parameters (scene/locale/speaker/text) — a scripted client can mint unlimited unique cache keys to burn the configured `GEMINI_API_KEY`'s quota/budget (a cost-based denial-of-service), and the two public registration/volunteer endpoints have no CAPTCHA, honeypot, or per-IP cap, letting anyone flood the data store with unlimited fake records.

**H2 — No CORS / Helmet / security-header middleware anywhere**
Repo-wide check for `cors`/`helmet` found no usage and no such packages in `package.json`. No Content-Security-Policy, X-Frame-Options, HSTS, or Referrer-Policy header is set anywhere. This leaves the admin interface clickjackable and removes a layer of defense-in-depth against any future XSS introduced elsewhere in the stack.

**H3 — `trust proxy: 1` is hard-coded while IP-based login throttling and cookie Secure/SameSite logic both key off the resulting `req.ip`/`req.secure`** (`server.ts`)
This setting is only correct if production sits behind exactly one trusted reverse-proxy hop that itself strips or overwrites any client-supplied `X-Forwarded-For`/`X-Forwarded-Proto`. If the real deployment topology differs (an extra CDN hop, a misconfigured load balancer), an attacker can spoof `X-Forwarded-For` to get a fresh `req.ip` on every request and fully bypass the login brute-force limiter (keyed on `ip:email`), and/or spoof `X-Forwarded-Proto: https` to obtain `SameSite=None` cookies over a connection that isn't actually TLS-terminated correctly. **[VERIFIED config; exploit conditions INFERRED pending confirmation of the real deployment topology.]**

### MEDIUM

**M1 — Hybrid cookie + Bearer session model with no CSRF token**
Admin requests are authenticated by *either* an `Authorization: Bearer` header *or* the HttpOnly session cookie — no CSRF token or double-submit check exists anywhere. Today's practical exploitability is low because `SameSite=Lax`/`SameSite=None;Secure` cookie attributes plus the absence of any CORS grant (mutating routes use PATCH/DELETE, which trigger CORS preflight that is simply never approved) incidentally block cross-origin abuse — but the design relies on that incidental protection continuing to hold rather than an explicit CSRF defense.

**M2 — Participant/volunteer PII and payment records stored as a single plaintext JSON file, with unencrypted backups**
`.data/platform-db.json` and `.data/backups/*.json` are plain `fs.writeFileSync` output with no field-level encryption at rest. `restoreBackup()` overwrites the entire live database from any file in that directory with only a `path.basename` sanity check — no signature or integrity verification on backup contents before restoring them.

**M3 — Audit log is not tamper-evident and has no external sink**
`AuditLogRecord`s live inside the same mutable JSON file they are meant to audit, hard-capped at 2000 entries with silent oldest-first eviction. Anyone with filesystem access — or a compromised SUPER_ADMIN account per C1 — can edit the history. There is no write-once log and no SIEM/webhook shipping of audit events.

**M4 — Payment webhook secret selection has no gateway binding**
`/api/payments/webhook` picks a single secret from `PAYMENT_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET` and checks it against whichever of three possible signature headers is present, with no check that the header name actually corresponds to the secret that produced the signature. Low likelihood in practice (these are all operator-controlled env vars), but a latent cross-gateway signature-confusion hazard if more than one secret is ever configured simultaneously.

### LOW

**L1 — Server-side email validation is far looser than client-side**
`/api/public/registrations` only checks `email.includes('@')` server-side, versus the stricter regex pattern enforced client-side in `registrationValidation.ts`. Trivially bypassed via a direct POST; a data-quality issue, not an XSS vector, since stored values are React-rendered admin-side with automatic escaping.

**L2 — Raw user utterance interpolated into an LLM prompt**
`/api/voice/parse-registration` builds its Gemini prompt by concatenating the user's utterance (already sanitized for PII patterns like card numbers, but not for prompt-injection patterns). Low impact in practice: the model's response is constrained by a strict JSON `responseSchema`, and every extracted field is independently re-validated by type/length/regex before being trusted — worst case is a mis-populated form field, not a real injection into anything consequential.

### Good security practices confirmed (no action needed)
- Password hashing: `crypto.scryptSync` + 16-byte random salt + `crypto.timingSafeEqual` comparison — solid, standard construction.
- Session tokens: HMAC-SHA256 signed, `timingSafeEqual`-verified, expiring, role-allowlisted on every verify — solid.
- Nearly every admin mutating route is gated server-side by a real permission check (either the `requireModule` middleware or an equivalent inline `authenticateAdmin` + `hasModulePermission` check) — confirmed, not just hidden in the UI, and confirmed live by the existing test suite's 401/403 assertions.
- Webhook signature verification (`verifyWebhookSignature`) is a correct HMAC-SHA256 + `timingSafeEqual` construction.
- CSV export sanitization correctly neutralizes formula-injection (`=`, `+`, `-`, `@` prefixes) — a frequently-missed control, implemented correctly here.
- Image uploads are base64-only, validated against a strict `data:image/(png|jpeg|jpg|webp);base64,` regex, capped at 8 MB, and saved under server-generated `crypto.randomUUID()` filenames — no path traversal, no arbitrary extension risk.
- A repo-wide grep for `eval(`, `dangerouslySetInnerHTML`, `child_process`, `exec(`, and `innerHTML =` across both `src/` and `server/` returned **zero matches** in application code.
- `sanitizeSensitiveUtterance` strips card-number/CVV/PIN/OTP patterns *before* any AI or heuristic processing touches voice input, and surfaces a clear user-facing refusal message rather than silently dropping the data.
- No real payment-card data ever reaches this application at all — the payment flow only ever returns an external-portal redirect unless gateway secrets are configured, and no such secrets exist in this checkout; card/PII handling is fully offloaded to the external official site today.

### Environment variables catalogued (names only — no values ever printed)
`PORT`, `NODE_ENV`, `GEMINI_API_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `APP_URL`, `DISABLE_HMR`.

**Scope note**: a full `npm audit`/outdated-dependency sweep was not performed as part of this pass — recommended as a follow-up before launch.

---

## Part B — Verified Bugs

| # | Bug | File:line | Severity | Status |
|---|---|---|---|---|
| B1 | Missing opening parenthesis around the `CANONICAL_CAROUSELS` array literal before its `satisfies ... .map(...)` expression — caused an immediate esbuild syntax error that **prevented the dev server from starting at all** | `src/utils/cmsSync.ts:959` | Critical (blocking) | **Fixed during this audit** (disclosed per the audit's own instructions — no other code was touched) |
| B2 | A **separate** type error: every `CANONICAL_CAROUSELS` entry includes a `draftSlides: []` field, but the surrounding `satisfies Omit<CarouselConfigRecord, 'draftSlides'>[]` assertion explicitly forbids that key — an excess-property-check failure invisible to `vite build` (esbuild strips types without checking them) but caught by `tsc --noEmit` | `src/utils/cmsSync.ts:1060`, `:1177` | Medium | Open, not fixed (outside this audit's no-modification scope) |
| B3 | `v.commentarySlot` accessed without a null guard | `server/store.ts:709` | Medium | Open |
| B4 | A merged array's inferred type doesn't satisfy `EventRecord[]` (missing `slug`/`isoDate`/`scheduleTime` on some members) | `src/app/pages/ProgramPage.tsx:28` | Medium | Open |
| B5 | Invalid Gemini model name `"gemini-4-hydrogen"` referenced for voice-registration AI field extraction — silently falls back to a deterministic heuristic rather than erroring loudly | `server/routes.ts:369` | Low (silent degradation, not a crash) | Open |
| B6 | Homepage `LeadershipSection`/`PartnershipSection` read only permanently-empty hardcoded arrays and never call the CMS hook, unlike the dedicated `/leadership`/`/partners` pages which correctly do | `src/content/eventContent.ts`, `LeadershipSection.tsx`, `PartnershipSection.tsx` | High (content-governance bug) | Open |
| B7 | Admin backup feature's audit-log message claims "Created encrypted JSON snapshot," but backups are plain, unencrypted JSON | `server/routes.ts` (backup handler) | Medium (misleading compliance claim) | Open |
| B8 | `/story` route has no entry in the global "MORE" menu or footer sitemap — reachable only via homepage CTAs | `src/content/navigationContent.ts` | Medium | Open |
| B9 | No dedicated 404/not-found page — the catch-all route silently renders the homepage | `src/app/routes.tsx` | Medium | Open |
| B10 | `InteractiveGitaBook3D` is both statically and dynamically imported, defeating its intended code-split (`INEFFECTIVE_DYNAMIC_IMPORT` build warning) | `src/app/pages/GitaPage.tsx`, `GitaBook3DShowcaseSection.tsx` | Low (performance) | Open |
| B11 | `npm install` fails under strict peer-dependency resolution — requires `--legacy-peer-deps` due to `esbuild@^0.25.0` (devDependency) vs. `vite@^8.3.0`'s peer requirement of `^0.27.0 || ^0.28.0` | `package.json` | Low | Open (workaround used for this audit) |
| B12 | README.md and `ASSET_GUIDE.md` describe a procedural Three.js "Living Architecture" hero (`LatheGeometry`/`ExtrudeGeometry` colonnade, `HeroSceneFallback.tsx`) that does not exist anywhere in `src/` — the actual hero is a 2D image carousel | `README.md`, `ASSET_GUIDE.md` vs. actual `src/components/hero/*` | Medium (documentation/reality mismatch) | Open |
| B13 | Homepage markets "700 Shlokas · 18 Chapters," but `scriptureContent.ts` holds one representative verse per chapter, not the full canonical text | marketing copy vs. `src/content/scriptureContent.ts` | Medium (content claim mismatch) | Open |
| B14 | Sanskrit chapter-recitation audio has no pre-baked offline fallback (unlike welcome narration, which does) — currently non-functional without a real `GEMINI_API_KEY` | `server.ts`, `public/audio/` | Medium | Open (by design absence, not a code defect) |
| B15 | "Memberships" admin module has create/list routes but no update/delete routes — partial CRUD | `server/routes.ts` | Medium | Open |
| B16 | No password-rotation endpoint exists for an already-created admin user (only settable at account-creation time) | `server/routes.ts` (users routes) | Medium | Open |
| B17 | Login rate-limiting and session-revocation state are both in-memory only — reset on server restart, not shared across multiple server instances | `server/routes.ts` | Low today / Medium at scale | Open — addressed by the MySQL migration plan (`revoked_tokens` table) |

---

## Part C — Confirmed via Executed Commands (not claims)

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` (`tsc --noEmit`) | **FAILED** — exactly the 4 errors listed as B2/B3/B4 above |
| Production build | `npm run build` | **Succeeded**, with the B10 code-split warning and two >500 kB chunks |
| Full test suite | `tsx --test` across every `*.test.ts` in `server/` and `src/` | **97/97 passed, 0 failures** |
| Dev server boot | `tsx server.ts` | Failed on first attempt with B1 (now fixed); succeeded afterward |
| TTS endpoint | `GET /api/chapters/1/recitation` | **HTTP 503** `TTS_UNAVAILABLE` — confirms designed graceful degradation without a real key |
| Live SPA routes | `/`, `/about`, `/gita`, `/story`, `/program`, `/registration`, `/admin`, and an invalid path | All returned **HTTP 200** with the identical SPA shell — confirms only that the server/Vite fallback works, **not** that each page renders correctly client-side (no real browser was used) |

---

## Part D — Explicitly Untested / Could Not Be Verified

These are flagged rather than assumed, per the audit's own instructions never to claim a feature passed without executing it:

- **Live Gemini API behavior** (TTS quality, voice-registration NLU accuracy, voice assistant end-to-end reliability) — `GEMINI_API_KEY` in this environment is the placeholder value; nothing that depends on a real key was exercised live.
- **Real browser rendering of any page** — no browser automation was available in this pass; all "page renders correctly" claims in the other four documents are based on static code reading, not observed rendering. This is explicitly called out wherever it matters (e.g. the live route checks in Part C above).
- **Runtime 3D performance / frame rate** on the Story and Welcome experiences — assessed only via static code review (disposal patterns, adaptive-quality code paths, asset sizes); no device profiling was performed.
- **Deep line-by-line audit** of several story-engine modules confirmed to be wired into the frame loop but not read in full (`cinematicCameraRig.ts`, `kurukshetraEnvironment.ts`, `weaponSystem.ts`, `chakraController.ts`, `vishvarupaTransform.ts`, `battleAnimationController.ts`) — confirmed non-stub, not individually audited for logic bugs.
- **`ScriptureExperience.tsx`** (the non-3D scripture reading view) was not deeply read in this pass.
- **Whether a real external production deployment of this app** already has a non-empty `.data/platform-db.json` with live participant/payment data — not observed in this local checkout; must be confirmed before any MySQL migration proceeds, per the Database Assessment document.
- **A full `npm audit` / dependency-vulnerability sweep** was not performed.
