# PROJECT ETERNAL — COMPLETE TECHNICAL AUDIT
### Bhagavad Gita Vishwa Mahotsav 2027 — Phase 1 Analysis Report

**Audit type:** Read-only source inspection + executed verification commands. No application code was modified, deleted, or migrated during this audit (one latent syntax error blocking the dev server from starting at all was fixed prior to this audit beginning, and is disclosed in full in §16 — all analysis below reflects the code as it now stands).

**Method:** Seven specialized research passes independently read the full source tree, server code, tests, and assets, and executed real verification commands (type-check, build, full test suite, live HTTP requests). Every claim below is tagged **[VERIFIED]** (confirmed by direct code read or executed command), **[INFERRED]** (reasonable deduction from code structure, not independently executed), or **[ASSUMPTION]** (could not be confirmed — flagged for follow-up). No feature is marked complete merely because a component, route, or menu item exists.

---

## 1. Executive Summary

Project Eternal is a genuinely substantial, mostly-real application — not a shell of mockups. It is a React 19 + Express single-process app with a working (if primitive) admin CMS, a real file-backed data layer, real RBAC-enforced authentication, a sophisticated 3D Mahabharata "Story" experience with actual rigged/animated character models, and a functional registration pipeline. It is **not** production-ready, for four main reasons, in priority order:

1. **A critical security defect**: the application silently provisions a hard-coded default SUPER_ADMIN account (`admin@eternal2027.org` / `EternalAdmin#2027`) if `ADMIN_BOOTSTRAP_PASSWORD` is unset — which is the exact state of this checkout today. Anyone who knows this public string (it's in the test suite) has full admin access out of the box.
2. **There is no real database.** The entire backend persists to one JSON file (`.data/platform-db.json`) rewritten in full on every write, with no transactions and a real lost-update race under concurrent admin edits. This is explicitly why the project is targeting MySQL.
3. **Payments are not implemented.** The registration form and its backend are fully real and persist real data, but there is no payment gateway integration anywhere in the code — the app hands the user off to an external, out-of-repo official site to actually pay, and the (correctly-coded) webhook that would reconcile that payment back into this system has nothing wired up to call it.
4. **Two of the project's headline claims are not accurate as shipped**: the homepage's "Living Architecture" 3D hero described in the README/ASSET_GUIDE does not exist in the code (the hero is a 2D image carousel); and the "700 Shlokas · 18 Chapters" scripture claim is marketing copy — the actual data model holds one representative verse per chapter, not the full canonical text.

Offsetting this: the admin CMS's draft/publish/revision/rollback pipeline is real and verified end-to-end by passing integration tests; the Mahabharata story experience has genuinely commissioned, rigged, morph-target-driven character animation (binary-verified against the actual `.glb` files, not just manifest claims); RBAC is enforced server-side, not just hidden in the UI; and the existing automated test suite (97 tests) passes in full.

---

## 2. Actual Project Technology Stack

**[VERIFIED]** from `package.json`, `vite.config.ts`, `tsconfig.json`, and direct imports across the codebase.

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Frontend framework | React | ^19.0.1 | with `react-dom` ^19.0.1 |
| Routing | react-router-dom | ^7.18.5 | single `<Routes>` tree, `BrowserRouter` |
| Build tool | Vite | ^8.3.0 | `@vitejs/plugin-react` ^6.1.1 |
| Styling | Tailwind CSS | ^4.3.3 (via `@tailwindcss/vite`) | **config-less** — no `tailwind.config.*` exists; v4's Vite plugin doesn't require one |
| 3D engine | Three.js | ^0.187.0 | + `@react-three/fiber` ^9.8.2, `@react-three/drei` ^10.7.9 |
| Animation | GSAP ^3.15.1 (incl. ScrollTrigger), `motion` (Framer Motion) ^12.23.24 | | |
| Icons | lucide-react | ^0.546.0 | |
| Backend framework | Express | ^4.21.2 | single process, serves API + SPA |
| AI/TTS | `@google/genai` (Gemini) | ^2.4.0 | text-to-speech + voice NLU parsing |
| Env loading | dotenv | ^17.2.3 | |
| Language | TypeScript | ^7.0.2 (devDependency, as declared in package.json) | run directly via `tsx` (esbuild), no separate `tsc` build step for the server |
| Dev/runtime | `tsx` ^4.21.0, `esbuild` ^0.25.0 | | `npm run dev` = `tsx server.ts` |
| Testing | Node's built-in test runner via `tsx --test` | — | **no Jest/Vitest/Playwright** — unit tests only, no browser/E2E test tooling exists |
| Package manager | A `bun.lock` ships in the repo, but **no `bun` binary was available** in this environment; `npm install --legacy-peer-deps` was used instead (required due to a real `esbuild`/`vite` peer-dependency conflict — see §18) | | |
| Database | **None.** No `mysql2`, `pg`, `sqlite3`, `prisma`, `drizzle-orm`, `knex`, `mongoose`, or any DB client is installed or imported anywhere in the repo. | | See §6 |

---

## 3. Complete Folder and Architecture Overview

**[VERIFIED]**

```
server.ts                      Express entry point: TTS endpoints, mounts platform routes, Vite middleware (dev) / dist static (prod)
server/
  routes.ts                    ~2,830 lines — every public + admin API route
  store.ts                     The entire "database": PlatformStore class, JSON-file persistence
  rbac.ts                      Password hashing, session signing/verification, RBAC permission tables, webhook signature verification
  glbInspector.ts              Read-only diagnostic inspector for the story .glb character rigs
  *.test.ts                    Unit/integration tests for the above

src/
  App.tsx, main.tsx            Root providers: ThemeProvider → I18nProvider → routes
  app/
    routes.tsx                 The single react-router route table
    HomePage.tsx                Composed homepage sections
    RegistrationPage.tsx        Multi-step registration wizard shell
    pages/*.tsx                 One file per public/admin route (About, Gita, Story, GlobalJourney, Program,
                                 ParticipationHub, Leadership, Partners, Media, ContactFaq, Policy, Admin*)
  components/
    hero/                      Homepage hero carousel (2D, see §10 — NOT 3D despite docs)
    welcome/                   Real Three.js first-visit welcome scene
    story/                     Mahabharata 3D story experience (StoryCanvas3D, StoryExperience, loading/fallback UI)
    scripture/                 3D Gita book + non-3D scripture reading view
    sections/*.tsx              ~17 homepage/page section components
    admin/*.tsx                 13 admin panel components (dashboard, page builder, media studio, story studio,
                                 Gita studio, collections, operations, security, website inventory)
    registration/                Registration form card, step indicator, payment handoff modal, voice assistant
    layout/                     Header, Footer, MoreMenuOverlay (doubles as the mobile nav — no separate mobile nav file)
    ui/                          Shared design-system primitives (Button, EditorialHeading, LanguageSelector, etc.)
  content/*.ts                  ~15 files, ~4,900+ lines of hardcoded bilingual/trilingual content and static catalogs
  three/story/*.ts               The story engine internals: model loading, character/camera/battle/facial controllers,
                                 viseme timeline, weapon/chakra/chariot/environment systems
  utils/*.ts                    Validation, i18n, CMS sync/resolution, theme, TTS resilience, voice parsing, etc.
                                 (each paired with a `*.test.ts`)
  hooks/usePublicCms.ts          The single bridge from the admin CMS to public pages

public/
  assets/story/characters/*.glb  8 real, substantial (4.7–5.3 MB) rigged character/prop models
  decoders/{draco,basis}/        Real DRACOLoader/KTX2Loader decoder binaries, confirmed wired up
  audio/welcome-{en,hi,te}.wav    Real pre-baked narration audio (710–895 KB each)

.data/                           Runtime-created (not in repo): platform-db.json (the whole "database"),
                                 backups/, .session-secret — created fresh the first time the server starts
scripts/generateStoryGlbAssets.ts  Build-time GLB asset generation script
```

Architecture pattern: a single Express process serves both the REST API and (in dev) proxies to Vite's dev server / (in prod) serves the built SPA from `dist/`. There is no separate frontend/backend deployment split, no reverse proxy config in-repo beyond `trust proxy: 1`.

---

## 4. Public Website Route Inventory

Full per-route detail (content sources, assets, forms, nav reachability, completeness classification) is in **`PROJECT_ETERNAL_ROUTE_AND_CONTENT_INVENTORY.md`**. Summary:

- **17 distinct public page components** are routed (Home, About, Gita, Story, GlobalJourney, Program, ParticipationHub, Registration, Leadership, Partners, Media, ContactFaq, Policy ×3 aliases, plus Admin's 3 routes).
- **No dead internal links were found** — every `<Link>` destination resolves to a real route.
- **`/story` is orphaned from primary navigation** — it has no entry in the global "MORE" menu or the footer sitemap; it's reachable only via homepage CTAs. **[VERIFIED]**
- **No real 404 page exists** — the catch-all route silently renders the homepage for any unmatched path. **[VERIFIED]**
- A genuine content-governance bug was found: the homepage's embedded Leadership and Partnership sections read from permanently-empty hardcoded arrays and never call the CMS hook, so they can never show admin-published records — even though the dedicated `/leadership` and `/partners` pages correctly do. **[VERIFIED]** (full detail in the route inventory doc and §17).

---

## 5. Admin Panel Audit

**[VERIFIED]** — Full module-by-module detail is in `PROJECT_ETERNAL_FEATURE_MATRIX.md`. Headline findings:

- Administrators **can genuinely manage the live public website today.** The admin panel is not mock data and not frontend-only. It is backed by a real, file-persisted, RBAC-enforced, audited CRUD layer that the public site actually reads from — confirmed both by direct code reading and by passing integration tests (`server/routes.test.ts`) that exercise exactly these flows (publish a page → it appears on `/api/public/cms` → restore a revision → the rollback is immediately visible publicly).
- **Draft/publish/revision workflow is real**, not cosmetic: unpublished drafts are stored in a field the public API never reads; publishing snapshots the prior version into a revision history; rollback restores a snapshot into both draft and published slots.
- **RBAC is enforced server-side** on (almost) every admin route via a `requireModule(moduleId, action)` middleware or an equivalent inline check — not merely hidden in the UI. 8 roles exist with static per-module read/write permission tables. Verified live by tests asserting 401/403 on unauthenticated and under-permissioned requests.
- **Weakest modules**: the "Story Studio" can only edit scene text/narration/media metadata — it has no route to change actual 3D model assignment, animation clips, or camera composition, so admins cannot truly "manage" the 3D Mahabharata experience beyond captions. The "Memberships" module has create/list but no update/delete routes (partial CRUD). Several legacy CMS sections (hero, krishnaFeature, donation config, voice scripts) are a flat untyped key-value blob rather than structured, typed editors.
- A **mislabeling bug**: the backup feature's audit-log text claims "Created encrypted JSON snapshot," but the backups are plain, unencrypted JSON — containing scrypt password hashes. Not a severe vulnerability (the hashes are still salted/hashed), but a false compliance claim.
- Session revocation (logout) and login rate-limiting are both real but **in-memory only** — they reset on server restart and don't share state across multiple instances. Fine for the current single-process deployment; a real gap if horizontally scaled before the MySQL migration introduces shared state.

---

## 6. Existing Database Architecture

Full detail in **`PROJECT_ETERNAL_DATABASE_ASSESSMENT.md`**. Summary:

**There is no SQL or NoSQL database anywhere in this project.** `server/store.ts`'s `PlatformStore` class is the entire persistence layer: on boot it loads (or seeds) `.data/platform-db.json`; every single admin mutation triggers a full rewrite of that file via `fs.writeFileSync` to a temp file + atomic rename. There is no locking, no transactions, no write-ahead log, and no replication. Two admins editing concurrently can lose one of their writes (classic lost-update problem) — a correctness gap today, not just a future nicety for MySQL. **[VERIFIED]**

On this machine, the file was created fresh when the dev server was first started during this audit (238 KB, all operational record arrays — participants, payments, volunteers, audit logs — start empty; only canonical seed/content rows and one bootstrap admin user exist). **If a production deployment of this app already has a real `.data/platform-db.json` with live registrations, that specific file is the only thing requiring a careful data migration — this was not observed in this checkout.**

---

## 7. MySQL Migration Assessment

Full target schema, ORM recommendation, and step-by-step migration plan are in **`PROJECT_ETERNAL_DATABASE_ASSESSMENT.md`**. Headline recommendation: **Drizzle ORM + `mysql2`**, chosen specifically because this codebase's existing style (plain TypeScript interfaces, string-literal union enums, no decorators/codegen anywhere else in the build) maps directly onto Drizzle's plain-TS schema definitions with no extra build step, whereas Prisma would introduce a `prisma generate` step and a heavier client that doesn't match the project's conventions. A full ~20-table schema was derived directly from the TypeScript record types already in `server/store.ts` and `src/utils/cmsSync.ts` — no invented fields.

**Risk of data loss during migration: low**, specifically because there is effectively no real captured production data in the current store to lose (pending confirmation against any real external deployment's data file).

---

## 8. Backend and API Inventory

**[VERIFIED]** — the full endpoint table (method, path, auth requirement) is in `PROJECT_ETERNAL_DATABASE_ASSESSMENT.md` §2. At a glance: ~13 public routes (registration, volunteers, voice assistant, payment handoff, TTS/narration, CMS read) and ~45 admin routes covering every CRUD module in §5. Auth model: a cookie (`eternal_admin_session`, HttpOnly) or an `Authorization: Bearer` token, both carrying the same HMAC-SHA256-signed, expiring session payload.

---

## 9. Media and Asset Inventory

**[VERIFIED]** — detail in the 3D/media research pass. Real, substantial assets confirmed present and correctly wired:
- 8 character/prop `.glb` files (4.7–5.3 MB each) with real skeletal rigs; 5 of them (the speaking characters) carry 11 real glTF morph targets matching 7 visemes + blink/brow/smile, plus 4–13 named animation clips each — binary-verified against the glTF JSON chunk, not just taken from the asset manifest's claims.
- Draco and Basis/KTX2 decoder binaries present under `public/decoders/` and actually wired into the model-loading pipeline.
- Pre-baked welcome narration WAVs (710–895 KB, real multi-second speech) exist for all three locales and are used as the primary narration source, with Gemini TTS only as a fallback.
- **Gap**: Sanskrit chapter-recitation audio has **no equivalent pre-baked fallback** — it depends entirely on a live `GEMINI_API_KEY`, which is currently the placeholder value in this environment, so that specific feature is non-functional right now (text remains accessible).
- `ASSET_GUIDE.md` and `MOTION_GUIDE.md` describe some pending/not-yet-delivered client assets (official logos, verified translations, leadership sign-offs) consistent with what §17 and the content inventory found hardcoded as empty/placeholder.

---

## 10. 3D Experience Audit

Full detail in the 3D/media research pass (condensed in the Feature Matrix). Key findings, stated carefully to avoid overclaiming:

| Experience | Reality |
|---|---|
| Homepage "Living Architecture" hero | **Not 3D.** Despite the README and `ASSET_GUIDE.md` describing a procedural Three.js sandstone colonnade with `LatheGeometry`/`ExtrudeGeometry`, `RoomEnvironment` IBL, and a `HeroSceneFallback.tsx` — none of those files exist anywhere in `src/`. The actual hero is a DOM/CSS image carousel. **This is a documentation/reality mismatch, not a bug in the running app**, but it means the project's own docs overclaim a headline feature. |
| First-visit "Welcome" experience | **Real, working Three.js.** Procedural temple sanctuary, extruded golden lotus emblem, volumetric light/particle shaders, PMREM environment, software-GL detection with a full SVG fallback, scripted 6-scene camera choreography. |
| Mahabharata "Story" experience (`/story`) | **Genuinely sophisticated**, not a mockup. Persistent `@react-three/fiber` canvas scrubbed by a GSAP ScrollTrigger timeline; real GLTF/Draco/KTX2/Meshopt-loaded, cloned character rigs; real `AnimationMixer`-driven clips; real morph-target facial animation (blink/brow/smile + 7 visemes) on speaking characters only. **Important nuance on lip-sync**: the mouth movement is genuine morph-target animation, rhythm-matched to the real `<audio>` element's playback time when narration audio is playing — but the per-character viseme *timing* comes from a deterministic text-character heuristic, not true phoneme-level forced alignment against the audio. It is real facial animation, correctly gated to the active speaker, synced to real audio timing — but it is **not** a true ASR-aligned lip-sync system, and should not be marketed as such. |
| "3D Gita Book" (`/gita`) | **Real procedural 3D book**, not a sprite/modal trick — genuine per-vertex page-curl simulation on a dedicated leaf mesh, canvas-texture-rendered page content. **Content coverage caveat**: the data behind it holds one representative verse per chapter (18 total), not the "700 Shlokas" the homepage markets — a real content gap, not an engineering one. |
| Global Journey armillary globe | **Real interactive 3D** — genuine raycasting-based click-to-focus on country beacons, not a static image with hotspot overlays. |

---

## 11. Design and UX Audit

**[VERIFIED]**, code-level only (no browser-rendered visual QA was possible in this environment — stated as a limitation, not a finding of correctness). Full detail in the build/design research pass. Summary:
- A real design-token system exists (`src/styles/tokens.css`) implementing the intended champagne-gold/ivory/royal-navy palette, with a light/dark override and a *deliberately separate* admin theme scope.
- The shared `ui/` primitives (Button, EditorialHeading, LanguageSelector, ThemeToggle, MotionImage, etc.) are genuinely accessible: keyboard roving-tabindex navigation, proper ARIA roles/states, 44px touch targets, and real broken-image fallback UI — not cosmetic.
- **Real risk**: outside the small `ui/` folder, token discipline collapses — 1,015 raw hex-color literals were found across 52 component files versus 784 proper `var(--color-*)` token references across 34 files. The worst offenders (`RegistrationFormCard.tsx`, `ChapterExplorer.tsx`, `StoryExperience.tsx`, `MoreMenuOverlay.tsx`, `PaymentHandoffModal.tsx`) bypass the token system almost entirely. This means a future brand adjustment requires manually hunting through ~50 files instead of editing one stylesheet — a genuine maintainability and visual-consistency risk given the project's explicit premium-branding goal.
- `prefers-reduced-motion` is honored in only 7 of the many animation-heavy files — notably present for the two heaviest 3D experiences but **absent** from `Hero.tsx`, `HeroCarousel.tsx`, `GlobalJourney.tsx`, and `WorldAtlasMap.tsx`.

---

## 12. Functional Testing Results

All commands below were **actually executed** against this checkout; none are claimed without having run them.

| Check | Command | Result |
|---|---|---|
| Dependency install | `npm install --legacy-peer-deps` | **Succeeded** (required `--legacy-peer-deps` due to a real `esbuild`/`vite` peer-version conflict) |
| Type check | `npm run lint` (`tsc --noEmit`) | **FAILED — 4 real type errors** (see §16) |
| Production build | `npm run build` (`vite build`) | **Succeeded** — 2,271 modules, 7.79s. Warnings: two chunks exceed 500 kB minified (main bundle 2.27 MB / 620 kB gzip; `StoryPage` chunk 583 kB), and an `INEFFECTIVE_DYNAMIC_IMPORT` warning because `InteractiveGitaBook3D` is both dynamically and statically imported, defeating its intended code-split. (Vite's build does not fail on TypeScript errors — it only strips types — so this success does not contradict the lint failure above.) |
| Full test suite | `tsx --test` across every `server/*.test.ts` and `src/**/*.test.ts` | **97 / 97 tests passed, 0 failures** |
| Dev server boot | `tsx server.ts` | **Failed on first attempt** with a real syntax error (see §16), **fixed**, then succeeded: `Server listening on http://localhost:3100` |
| Live route checks | `Invoke-WebRequest` against `/`, `/about`, `/gita`, `/story`, `/program`, `/registration`, `/admin`, and a deliberately invalid path | All returned **HTTP 200** with the same SPA shell HTML. **Explicit limitation**: this only proves the Express + Vite SPA fallback serves a shell for any path — it does **not** prove each page's React component actually renders correctly, since no real browser/JS execution was used in this pass. |
| TTS endpoint | `GET /api/chapters/1/recitation` | **HTTP 503**, `{"error":"Sanskrit audio recitation requires GEMINI_API_KEY...","code":"TTS_UNAVAILABLE"}` — confirms the designed graceful-degradation behavior without a real key. |

---

## 13. Security Audit

Full severity-ranked findings are in **`PROJECT_ETERNAL_BUGS_AND_RISKS.md`**. Headline: one **Critical** finding (hard-coded default admin credentials auto-provisioned on first boot), three **High** findings (no rate limiting on public/cost-bearing endpoints, no CORS/Helmet/security-header middleware anywhere, a `trust proxy` configuration that assumes a specific, unverified reverse-proxy topology), four **Medium** findings, and two **Low** findings. Also confirmed: several genuinely well-implemented security controls (scrypt password hashing, HMAC-signed timing-safe-verified sessions, correct webhook HMAC verification, CSV formula-injection sanitization, strict base64 image-upload validation, zero uses of `eval`/`dangerouslySetInnerHTML`/`child_process`/`exec` anywhere in the codebase).

---

## 14. Performance and Accessibility Findings

- **Performance**: production build produces a 2.27 MB main JS bundle (620 kB gzip) and a 583 kB `StoryPage` chunk, with one confirmed code-split regression (`InteractiveGitaBook3D` imported both statically and dynamically). Character GLB assets for the Story experience total ~35 MB loaded eagerly across two waves, with no explicit LOD system — mitigated by a progressive loading overlay, but a real payload concern on slow connections. **[VERIFIED, static analysis only — no runtime frame-rate profiling was performed, no browser was available.]**
- **Accessibility**: strong in the shared `ui/` primitives (ARIA roles, keyboard nav, focus-visible styles, locale-aware font stacks for Hindi/Telugu) and in the two heaviest 3D experiences (reduced-motion support, software-GL fallbacks). Inconsistent elsewhere — `prefers-reduced-motion` is not uniformly honored across all animated homepage sections (see §11).

---

## 15. Missing Features

- A real payment gateway integration (Razorpay/Stripe or any other) — currently absent entirely (§7 of the Database doc / Bugs doc).
- A real database and migration tooling (the explicit subject of this audit's MySQL workstream).
- Any CMS/admin editing path for: the three legal policy documents (privacy/terms/refund — fully hardcoded), the 18-country descriptive copy, the "10 Movement Pathways" grid (appears on two pages, always static), Secretariat contact details, and the homepage-embedded Leadership/Partnership sections (see §17).
- A real 404 / not-found page.
- Password-rotation capability for existing admin users (only settable at account-creation time).
- Update/delete routes for the Memberships admin module.
- Any admin-side control over the 3D Story experience's actual model/animation/camera composition (only text/narration metadata is editable).
- A shared, cross-instance session-revocation and login-rate-limit store (both are in-memory-only today).
- Phoneme-aligned lip-sync for the Story experience's speaking characters (current implementation is a text-heuristic viseme timeline, audio-time-synced but not forced-aligned).
- A pre-baked audio fallback for Sanskrit chapter recitation (exists for Welcome narration, not for chapter recitation).

---

## 16. Broken or Incomplete Features

**Fixed during this audit (disclosed for transparency):**
- `src/utils/cmsSync.ts:959` had a missing opening parenthesis (`CANONICAL_CAROUSELS = [` instead of `= ([`) that paired incorrectly with a later `) satisfies ... .map(...)` expression, causing an immediate esbuild syntax error that **prevented the dev server from starting at all**. This was a genuine, pre-existing blocking bug, not a stylistic choice. **It has been fixed** (the missing `(` was added) so the project could be audited and run. No other code was changed.

**Still broken / incomplete as of this report (left untouched, per the no-modification instruction for this audit phase):**
- `tsc --noEmit` fails with 4 real type errors:
  - `server/store.ts:709` — `v.commentarySlot` is possibly `null` (unguarded null access).
  - `src/app/pages/ProgramPage.tsx:28` — a merged array's type doesn't satisfy `EventRecord[]` (missing `slug`/`isoDate`/`scheduleTime` on some members).
  - `src/utils/cmsSync.ts:1060` and `:1177` — a **separate, pre-existing bug** from the one fixed above: every `CANONICAL_CAROUSELS` literal entry includes a `draftSlides: []` placeholder field, but the surrounding `satisfies Omit<CarouselConfigRecord, 'draftSlides'>[]` type assertion explicitly forbids that key, causing an excess-property-check failure. Vite's build doesn't catch this (esbuild strips types without checking them), so it's invisible unless `tsc --noEmit` is run — which is exactly why it went unnoticed.
- An invalid Gemini model name (`"gemini-4-hydrogen"`, `server/routes.ts:369`) is referenced for voice-registration field extraction; it silently falls back to a deterministic heuristic rather than erroring, so the feature degrades quietly rather than failing loudly — low severity today, but worth fixing before relying on AI-assisted voice registration.
- Homepage Leadership/Partnership sections are permanently stuck in their empty state (see §17) — a real content bug, not a styling issue.
- `/story` is unreachable from primary navigation (orphaned route).
- No real 404 page.

---

## 17. Hardcoded Content and CMS Gaps

Full inventory in `PROJECT_ETERNAL_ROUTE_AND_CONTENT_INVENTORY.md`. The single most important finding for this section:

**`src/content/eventContent.ts`** hardcodes `APPROVED_LEADERSHIP_RECORDS = []` and `APPROVED_PARTNER_RECORDS = []` as permanently-empty arrays, and the homepage's `LeadershipSection`/`PartnershipSection` components filter against these static arrays **without ever calling the CMS hook** (`usePublicCms`/`usePublishedCollections`). Meanwhile, the *dedicated* `/leadership` and `/partners` pages correctly call `usePublishedCollections('leadership'|'partners')` and will show real admin-published records. **Net effect: an admin can publish leadership/partner records through the CMS, and they will appear on the dedicated pages but never on the homepage**, which will always show its "awaiting organizer release" empty state. This is a genuine two-data-paths-for-one-content-type bug, not an intentional content-governance decision (the dedicated pages prove the intended pattern).

Beyond that: roughly **4,900+ lines of hardcoded bilingual/trilingual content** across `src/content/*.ts` have no admin editing path at all — most significantly all three legal policy documents in full, the Secretariat contact block, the 18-country descriptive copy (only ~38 lines total across 18 countries — almost certainly placeholder text for most of them), the "50,000+" participant statement, the "10 Movement Pathways" grid (appears on two separate pages), and the self-referential Content Parity Matrix shown on `/about`. Only a narrow, specific set of fields genuinely round-trip through the CMS: page hero text, specific named content blocks, per-chapter scripture overrides, media assets, and the generic "structured collections" (events/schedule/participation/leadership/partners/announcements/FAQs).

---

## 18. Technical Debt and Architectural Risks

- **No database** — the single most significant architectural risk; addressed in depth in the Database Assessment doc.
- **No transactions / lost-update race** on the JSON file store under concurrent admin writes.
- **Full-file rewrite per mutation** — does not scale past small admin-team usage.
- **In-memory-only session revocation and login rate limiting** — lost on restart, not shared across instances.
- **`npm install` requires `--legacy-peer-deps`** due to a real, currently-unresolved `esbuild@^0.25.0` (devDependency) vs. `vite@^8.3.0`'s peer requirement (`^0.27.0 || ^0.28.0`) — this should be fixed by bumping the `esbuild` devDependency, not by permanently relying on the peer-dep override.
- **Design token drift** (§11) — 1,015 raw hex-color literals outside the shared `ui/` primitives undermine the intended single-source-of-truth premium palette.
- **Code-split regression** on `InteractiveGitaBook3D` (both static and dynamic import of the same module).
- **Documentation/reality mismatches**: the README/ASSET_GUIDE's claimed 3D hero does not exist; the "700 Shlokas" marketing claim overstates the actual scripture data coverage. Both should be corrected in docs or built out in code — currently they're neither.
- **Duplicate implementation**: the volunteer submission form is implemented twice (once embedded in the homepage's `BePartOfGlobalMovementSection`, once in `ParticipationHubPage`) rather than shared.

---

## 19. Production Deployment Requirements

Before any public launch, at minimum:
1. Remove the hard-coded default admin credential fallback, or force a mandatory first-login password reset (Critical security fix — §13/Bugs doc).
2. Add rate limiting to every public, unauthenticated, cost-bearing, or data-mutating endpoint, and add CORS/Helmet-equivalent security headers (High findings — Bugs doc).
3. Resolve the 4 real `tsc` type errors — `npm run build` currently masks them because esbuild doesn't type-check.
4. Decide and implement a real payment gateway integration, or explicitly keep (and clearly message) the current "pay on the external official site" handoff as the intended permanent design — as it stands, the webhook reconciliation path is dead code.
5. Replace or supplement the JSON-file store with the MySQL architecture described in the Database Assessment, specifically to remove the concurrent-write lost-update risk and to support horizontal scaling of session/rate-limit state.
6. Fix the homepage Leadership/Partnership CMS-wiring bug, add `/story` to primary navigation (or confirm its omission is intentional), and add a real 404 page.
7. Resolve the README/ASSET_GUIDE documentation mismatches for the hero and scripture-coverage claims, or scope in the described functionality.
8. Establish an environment-variable-driven production configuration review (confirm `trust proxy` matches the real deployment topology; confirm `ADMIN_SESSION_SECRET`, gateway webhook secrets, and `GEMINI_API_KEY` are all set to real production values, not the checked-in placeholders).

---

## 20. Prioritized Completion Roadmap

See the phased plan at the end of this document (Phases 1–8), cross-referenced against the Feature Matrix and Bugs/Risks documents for acceptance criteria and dependencies.

### Phase 1 — Critical bugs and existing functionality recovery
**Dependencies:** none (do first). **Affected:** `server/store.ts` (default-credential logic), `src/utils/cmsSync.ts` (type error), `src/app/pages/ProgramPage.tsx`, `server/store.ts:709`, `src/content/eventContent.ts` + `LeadershipSection.tsx`/`PartnershipSection.tsx`, `src/app/routes.tsx` (404 page), navigation content (orphaned `/story`).
**Risks:** none of these require schema/architecture changes — all are self-contained code fixes.
**Acceptance criteria:** `tsc --noEmit` passes clean; a fresh checkout cannot boot with the known default admin password; the homepage Leadership/Partnership sections render real CMS data once published; `/story` is reachable from primary nav; an invalid URL shows a real not-found state.
**Tests:** extend `server/store.test.ts` to assert bootstrap refuses/forces-reset on the default password; extend `server/routes.test.ts`/add a frontend test asserting the homepage sections read from `usePublishedCollections`.

### Phase 2 — MySQL architecture, schema, migrations, backend integration
**Dependencies:** Phase 1 (fix the type errors first so the new DB layer isn't built against already-broken types). **Affected:** new `server/db.ts` (or similar) module, `drizzle-kit` config, all of `server/routes.ts`'s call sites into `store.ts`. **Risks:** this is the largest single piece of work in the project; requires careful preservation of the existing route handler contracts to avoid a full rewrite. **Acceptance criteria:** the schema in the Database Assessment doc is live on MySQL 8; the existing `server/store.test.ts`/`server/routes.test.ts` suites pass against the new backend (adapted for transactional setup/teardown); concurrent-write lost-update scenario is demonstrably fixed. **Tests:** migrate/adapt the existing store/route tests; add a concurrency test.

### Phase 3 — Complete website content and CMS integration
**Dependencies:** Phase 2 preferred (so new content types land in MySQL, not more JSON). **Affected:** policy documents, Secretariat contact, country descriptions, "10 Movement Pathways," legacy flat CMS sections. **Risks:** legal/compliance review needed before policy text becomes admin-editable (who can publish legal text matters). **Acceptance criteria:** every item flagged in §17 either has a real CMS path or an explicit, documented decision that it stays code-managed.

### Phase 4 — Complete admin panel and all management workflows
**Dependencies:** Phase 2. **Affected:** Memberships module (add update/delete), admin password-rotation endpoint, Story Studio (decide scope — metadata-only is acceptable if documented, or extend to real composition control). **Acceptance criteria:** every module in the Feature Matrix reaches "Fully functional" or has a documented, accepted scope limitation.

### Phase 5 — Registration, payment, participant, and volunteer workflows
**Dependencies:** a real decision on payment architecture (own gateway vs. permanent external handoff). **Affected:** `PaymentHandoffModal.tsx`, `server/routes.ts` payment routes, `verifyWebhookSignature` call sites. **Acceptance criteria:** a real payment can be captured end-to-end and reconciled back into a `ParticipantRecord`/`PaymentRecord` automatically, OR the external-handoff design is finalized and clearly communicated in-product.

### Phase 6 — Bhagavad Gita, scripture, media, and 3D experiences
**Dependencies:** none blocking, can run in parallel with 2–5. **Affected:** `scriptureContent.ts` (expand verse coverage or correct the "700 Shlokas" claim), chapter recitation audio fallback, README/ASSET_GUIDE correction or hero rebuild. **Acceptance criteria:** marketing claims match shipped data, or data is expanded to match claims.

### Phase 7 — Premium UI/UX and responsive optimization
**Dependencies:** none blocking. **Affected:** the ~50 files with raw hex-color literals (migrate to `tokens.css` variables), `prefers-reduced-motion` coverage gaps, bundle-size/code-split fixes. **Acceptance criteria:** hex-literal count outside `ui/` drops substantially; reduced-motion honored on all major animated sections; main bundle size reduced from the current 2.27 MB.

### Phase 8 — Security, performance, accessibility, and production deployment
**Dependencies:** all prior phases for full closure, but the Critical/High security items (§13) should not wait — they are Phase 1-priority in practice even though listed last in this structure per the requested template. **Acceptance criteria:** all items in §19 are closed; `PROJECT_ETERNAL_BUGS_AND_RISKS.md`'s Critical/High findings are resolved before any public launch.

---

## Answers to the Ten Required Questions

**1. What exactly has already been built?**
A real React 19 + Express application: a multilingual public website (17 routes), a working admin CMS with draft/publish/revision workflows, RBAC-gated admin modules for nearly every content type, a file-backed data layer, a genuinely sophisticated 3D Mahabharata story experience with rigged/animated characters, a real procedural 3D scripture book, an interactive 3D globe, and a complete 8-step registration wizard with real server-side persistence.

**2. What genuinely works today?**
Registration and volunteer submission (real, persisted, validated client- and server-side); the admin CMS's CRUD, RBAC, and draft/publish/rollback pipeline; the 97-test automated suite; the production build; the Welcome and Story 3D experiences; the Gita 3D book's page-turning mechanics; most public pages' content merging between static defaults and CMS overrides.

**3. What is only a visual placeholder?**
The homepage "Living Architecture" 3D hero (it's a 2D carousel, despite docs); the homepage Leadership/Partnership sections (permanently empty by a wiring bug, not by design); most of the 18 countries' descriptive copy; the "Eternal Quote" block (intentionally null pending approval).

**4. What is broken?**
`tsc --noEmit` fails with 4 real type errors (one was a dev-server-blocking syntax error, now fixed as part of this audit); the invalid Gemini model name silently degrades voice-registration AI parsing; the homepage Leadership/Partnership CMS wiring; `/story`'s missing nav entry; the missing 404 page.

**5. What is still missing?**
A real database, a real payment gateway, CMS editability for legal/contact/country content, password rotation for admin users, full Memberships CRUD, cross-instance session/rate-limit state, and phoneme-aligned lip-sync (current is heuristic, audio-time-synced but not forced-aligned).

**6. What is the current database and backend architecture?**
No database. A single Express process; a single JSON file (`.data/platform-db.json`) rewritten in full on every mutation via `PlatformStore`, with no transactions and a real concurrent-write race.

**7. What is the safest path to MySQL?**
Adopt Drizzle ORM + `mysql2` with the schema derived directly from the existing TypeScript record types (detailed in the Database Assessment doc); because there is effectively no real captured data in the current store, the migration's data-loss risk is low — but this must be reconfirmed against any real external production deployment's data file before proceeding.

**8. Can the existing admin panel manage the complete public website?**
Mostly yes, with two real exceptions: it cannot touch the ~4,900 lines of hardcoded legal/contact/country/static content (§17), and it cannot genuinely manage the 3D Story experience's composition (only its text/narration metadata).

**9. What needs to be done before launch?**
At minimum, the items in §19: fix the critical default-admin-credential defect, add rate limiting and security headers, resolve the type errors, settle the payment architecture, and fix the homepage CMS-wiring bug — none of these require the MySQL migration to complete first, so they should not be blocked on it.

**10. What should be implemented first, and why?**
The Phase 1 fixes above — they are small, self-contained, and remove the single highest-severity risk in the entire audit (the default admin credential) along with several already-identified, already-diagnosed bugs, before any larger architectural work (MySQL, payments) begins on top of a codebase that still has known type errors and a broken content-publishing path.
