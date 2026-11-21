# PROJECT ETERNAL — COMPLETE FEATURE MATRIX

Companion to `PROJECT_ETERNAL_COMPLETE_TECHNICAL_AUDIT.md`. Every status below reflects direct source inspection and, where noted, executed verification commands — not the presence of a route, button, or component alone. **V** = Verified by direct code read or executed command. **I** = Inferred from code structure, not independently executed. **A** = Assumption / could not be confirmed in this pass.

Legend for "Actual working status": **Fully functional** / **Partially functional** / **Frontend-only** / **Mock data** / **Not connected to DB** / **Broken** / **Not implemented**.

## Public Website

| Feature / Module | Existing implementation | Actual working status | Frontend | Backend | Database | Missing work | Priority |
|---|---|---|---|---|---|---|---|
| Homepage (`/`) | 15 composed sections, hybrid static+CMS | Partially functional (V) | Yes | Partial | Partial | Fix Leadership/Partnership CMS wiring; wire MediaSection to CMS | High |
| About page | Static + 1 named CMS block override | Fully functional for what it does; mostly hardcoded (V) | Yes | Partial | No | No CMS path for Yoga Pillars / "18" stats / Parity Matrix | Low |
| Bhagavad Gita page (`/gita`) incl. 3D book | Real procedural 3D book + chapter data merge | Fully functional, content-limited (V) | Yes | Yes | Yes (overrides) | Expand verse data beyond 1-per-chapter or correct marketing claim | Medium |
| Mahabharata Story (`/story`) | Real 3D engine, rigged/animated characters | Fully functional, orphaned from nav (V) | Yes | Yes | Yes (overrides) | Add to primary nav; recitation audio has no offline fallback | Medium |
| Global Journey / 18 Countries | Real interactive 3D globe + static country list | Partially functional (V) | Yes | No | No | Most of 18 countries likely show placeholder copy (I) | Medium |
| Program / Schedule | Real 3-tier static+CMS merge | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Participation Hub | Real form, real CMS merge for 6 pathways | Fully functional (V) | Yes | Yes | Yes | "10 Movement Pathways" grid has no CMS path; duplicate volunteer-form code vs. homepage | Low |
| Registration (8-step wizard) | Real validation + real API submission | Fully functional (V) | Yes | Yes | Yes (JSON file) | None at the form/submission level | — |
| Payment handoff | Modal UI + `create-order` endpoint | Not implemented (gateway) / Frontend-only for checkout (V) | Yes | Stub | N/A | No real gateway SDK anywhere; redirects to external official site | Critical |
| Payment webhook | HMAC-SHA256 signature verification, real update logic | Fully functional code, but orphaned — nothing calls it legitimately (V) | N/A | Yes | Yes | Needs a real gateway wired to actually send webhooks | Critical |
| Refunds | Local bookkeeping record + status flip | Partially functional — ledger only, no real gateway refund (V) | Admin only | Yes | Yes | Real gateway refund API call | High |
| Volunteer submission | Real form + real API + approval workflow | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Voice registration assistant | Browser STT + Gemini NLU + TTS/fallback | Partially functional — depends on live `GEMINI_API_KEY` (V, dependency untested live) | Yes | Yes | N/A | Invalid model name `gemini-4-hydrogen` silently degrades extraction (V) | Medium |
| Leadership page (dedicated) | Real CMS-wired collection merge | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Partners page (dedicated) | Real CMS-wired collection merge | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Homepage Leadership/Partnership sections | Reads only a hardcoded empty array | **Broken** — can never show real data (V) | Yes | No (bug) | No (bug) | Wire to `usePublishedCollections` like the dedicated pages | High |
| Media / Gallery page | Best CMS coverage of any page (media + mediaAssets + announcements + legacy cms) | Fully functional (V) | Yes | Yes | Yes | Static announcements can be added-to but never removed by admin | Low |
| Contact & FAQ page | Real FAQ merge by ID; contact details fully static | Partially functional (V) | Yes | Partial | Partial | Contact details not CMS-editable | Medium |
| Policy pages (privacy/terms/refund) | 100% hardcoded legal text, all 3 languages | Not connected to DB (by design, but risky) (V) | Yes | No | No | Legal/compliance review + CMS path for policy text | High |
| Navigation (header / MoreMenuOverlay / footer) | Real, shared desktop+mobile overlay nav | Fully functional, one orphaned route (V) | Yes | No | No | Add `/story` entry | Medium |
| 404 / not-found handling | None — catch-all renders homepage | **Missing feature** (V) | No | N/A | N/A | Build a real not-found page/state | Medium |
| i18n (en/hi/te) | Locale provider + per-locale font stacks + content fields | Fully functional (V) | Yes | N/A | Partial (some content locale-incomplete) | Audit coverage of hi/te fields across content files | Low |

## 3D / Media Experiences

| Feature / Module | Existing implementation | Actual working status | Frontend | Backend | Database | Missing work | Priority |
|---|---|---|---|---|---|---|---|
| Homepage "Living Architecture" 3D hero | Does not exist — hero is a 2D image carousel | **Not implemented** despite doc claims (V) | No (as described) | N/A | N/A | Build it, or correct README/ASSET_GUIDE | Medium |
| Welcome first-visit 3D scene | Real Three.js procedural scene + SVG fallback | Fully functional (V) | Yes | Partial (TTS) | N/A | None found | — |
| Story character rigs/animation | Real skeletal rigs, 11 morph targets on speaking characters, real `AnimationMixer` clips | Fully functional (V, binary-verified) | Yes | N/A | N/A | None found | — |
| Story facial "lip-sync" | Morph-target mouth animation, audio-time-synced, text-heuristic viseme timing (not phoneme-aligned) | Partially functional — real animation, not true forced-aligned lip-sync (V) | Yes | Yes | N/A | Phoneme/forced alignment if "lip-sync" claims are to be literal | Low |
| 3D Gita Book page-turning | Real per-vertex curl simulation | Fully functional (V) | Yes | N/A | N/A | None found | — |
| Sanskrit chapter recitation audio | Gemini TTS, disk-cached, **no pre-baked fallback** | Partially functional — currently non-functional without a real API key (V) | Yes | Yes | N/A | Add pre-baked fallback like welcome audio has | Medium |
| Global Journey armillary globe | Real raycasting-based interactive 3D | Fully functional (V) | Yes | No | No | None found | — |
| GLB asset pipeline (Draco/KTX2/Meshopt) | Real decoders present and wired | Fully functional (V) | Yes | N/A | N/A | None found | — |

## Admin Panel

| Feature / Module | Existing implementation | Actual working status | Frontend | Backend | Database | Missing work | Priority |
|---|---|---|---|---|---|---|---|
| Admin login / logout / session | Real scrypt hashing, HMAC sessions, cookie+bearer, real revocation | Fully functional (V) | Yes | Yes | Yes | Revocation/rate-limit state is in-memory only (not DB-backed) | Medium |
| RBAC (8 roles, per-module perms) | Static permission tables, server-enforced | Fully functional (V, test-confirmed) | Yes | Yes | N/A (code, not data) | None found | — |
| Dashboard / overview | Real live metrics from store arrays | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Participants management | Full CRUD + CSV/Excel export | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Payments & refunds (ledger) | Full CRUD, refund bookkeeping | Fully functional (ledger only) (V) | Yes | Yes | Yes | Real gateway integration (see Public table) | Critical |
| Volunteers management | Full CRUD + approval workflow | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Memberships | Create + list only | **Partially functional** — no update/delete route (V) | Yes | Partial | Yes | Add PATCH/DELETE routes | Medium |
| Media (gallery/video) | Full CRUD + upload (base64, validated, 8MB cap) | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Media Asset Library (smart assets) | Full CRUD + cross-content "replace" propagation | Fully functional, verified end-to-end (V, test-confirmed) | Yes | Yes | Yes | None found | — |
| Page Builder (draft/publish/revisions) | Real draft/published separation, revision snapshots, rollback | Fully functional, verified end-to-end (V, test-confirmed) | Yes | Yes | Yes | None found | — |
| Carousels | Same draft/publish/revision model as pages | Fully functional (V, test-confirmed) | Yes | Yes | Yes | None found | — |
| Scripture / Chapters & Verses Studio | Full CRUD on overrides | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Story Scenes Studio | Edits text/narration/media metadata only | **Partially functional** — no control over 3D composition/animation/model assignment (V) | Yes | Yes | Yes | Decide & document scope, or extend to real 3D control | Medium |
| GLB inspection tool | Read-only diagnostics | Fully functional (read-only, as intended) (V) | Yes | Yes | N/A | None found | — |
| Structured Collections (leadership/partners/events/schedule/announcements/FAQs) | Generic CRUD route family | Fully functional (V) | Yes | Yes | Yes | None found | — |
| Legacy CMS sections (hero, krishnaFeature, donation config, voice scripts) | Flat key-value `CmsManagedItem` CRUD | **Partially functional** — low-fidelity, not structured/typed | Yes | Yes | Yes | Replace with typed editors matching real component props | Low |
| RBAC Users management | Create/patch (role, active), password hash at creation | **Partially functional** — no password-rotation route for existing users (V) | Yes | Yes | Yes | Add self-service / admin-triggered password reset | Medium |
| Audit logs | Append-only, every mutating route logs, capped at 2000 (ring-buffer) | Fully functional (V) | Yes | Yes | Yes | Not tamper-evident, no external sink (see Bugs/Risks) | Medium |
| Settings toggles | Real, read by public routes (registrationOpen, volunteer approval, etc.) | Fully functional (V) | Yes | Yes | Yes | `backupRetentionDays` field exists but is never enforced | Low |
| Backups (create/list/restore) | Real plain-JSON snapshot copy | Fully functional, but **mislabeled "encrypted"** in audit text (V) | Yes | Yes | Yes | Either encrypt backups or correct the label; add retention enforcement | Medium |
| Draft/Preview workflow | Admin can preview any page incl. unpublished | Fully functional (V) | Yes | Yes | Yes | None found | — |

## Backend / Infrastructure

| Feature / Module | Existing implementation | Actual working status | Frontend | Backend | Database | Missing work | Priority |
|---|---|---|---|---|---|---|---|
| Data persistence | Single JSON file, atomic write-then-rename, full rewrite per mutation | **Not production-durable** — no transactions, concurrent-write lost-update race (V) | N/A | Yes | **No real DB** | Full MySQL migration (see Database Assessment) | Critical |
| Admin auth/session security | scrypt + HMAC, timing-safe compares | Fully functional, well-implemented (V) | N/A | Yes | N/A | None found | — |
| Default admin bootstrap | Hard-coded fallback email/password if env unset | **Critical security defect** (V) | N/A | Yes | Yes | Remove fallback or force reset-on-first-login | Critical |
| Rate limiting | Only on admin login (12/10min/IP+email, in-memory) | **Partially functional / largely missing** (V) | N/A | Partial | N/A | Add to all public/cost-bearing endpoints | High |
| CORS / security headers | None found anywhere | **Not implemented** (V) | N/A | No | N/A | Add Helmet-equivalent + CORS policy | High |
| CSV/Excel export | Formula-injection-sanitized, correct | Fully functional (V) | Admin only | Yes | Yes | None found | — |
| Build pipeline | Vite build succeeds; `tsc --noEmit` fails (4 errors) | **Partially functional** — build masks real type errors (V, executed) | N/A | N/A | N/A | Fix the 4 type errors (see Audit §16) | High |
| Automated test suite | 97 unit/integration tests via `tsx --test` | Fully functional — **97/97 passing** (V, executed) | N/A | N/A | N/A | No E2E/browser test tooling exists at all | Medium |
| Dependency installation | `bun.lock` present but no `bun` runtime available; npm requires `--legacy-peer-deps` | **Partially functional** — real peer-dependency conflict | N/A | N/A | N/A | Bump `esbuild` devDependency to resolve the conflict properly | Low |
| Design token system | Real CSS-variable palette, but ~1,015 raw hex literals outside `ui/` | **Partially functional** — drift risk (V) | Yes | N/A | N/A | Migrate hardcoded hex colors to tokens | Medium |
