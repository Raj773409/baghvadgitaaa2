# PROJECT ETERNAL — DATABASE ASSESSMENT
### Current architecture, MySQL target design, and migration plan

All findings below are **[VERIFIED]** by direct reading of `server/store.ts`, `server/routes.ts`, `server/rbac.ts`, `package.json`, and a repo-wide grep for any database reference, plus execution of the existing test suite — unless marked otherwise.

---

## 1. Current Architecture

**There is no SQL or NoSQL database anywhere in this project.** The entire "database" is a single JSON file read and written with Node's `fs` module.

- `server/store.ts` — `PlatformStore` class:
  - Data directory: `<repo root>/.data`. DB file: `.data/platform-db.json`. Backups: `.data/backups/`.
  - `load()`: on boot, reads `platform-db.json` if present, JSON-parses it, shallow-merges it onto a freshly-seeded `createInitialDatabase()` result, and re-persists if any canonical seed rows were missing (`ensureCanonicalSeedData`).
  - `persistSync()`: writes a `.tmp` file, then `fs.renameSync` — **atomic at the OS level**, but with **no locking, no transactions, no write-ahead log**.
  - `save()` is called after essentially every mutation (every admin PATCH/POST/DELETE), and implicitly inside `appendAudit()`/`appendRevision()` — meaning persistence is, in practice, an implicit side effect of audit logging rather than an explicit, guaranteed contract. If a future route forgot to call `appendAudit`, a write could silently fail to persist.
  - **Each write rewrites the entire file.** This does not scale past small admin-team usage and gets slower as the dataset grows.
  - `createBackup()` / `listBackups()` / `restoreBackup()`: manual, on-demand, full-JSON snapshot copy/restore. No scheduled backups, and the `backupRetentionDays` setting field exists in the schema but is **never read or enforced anywhere** in the code.
  - Session signing secret is also file-based: `.data/.session-secret` (mode 0600), generated once if `ADMIN_SESSION_SECRET` isn't set, and persisted so it survives restarts.
  - Confirmed live on the audit machine: `.data/platform-db.json` was 238,390 bytes, created fresh the moment `npm run dev` was first run during this audit — i.e. this is a **fresh seed, not pre-existing user data.**
- `package.json` dependencies/devDependencies contain **no** `mysql2`, `pg`, `sqlite3`/`better-sqlite3`, `prisma`, `drizzle-orm`, `knex`, or `mongoose`.
- A repo-wide grep for `DATABASE_URL|mysql|postgres|sqlite|prisma|drizzle|knex|mongoose|supabase|firebase` (excluding `node_modules`) returns exactly **one** hit — a doc-comment in `src/types/cms.ts` mentioning "Firebase Auth" as one *hypothetical* option in prose, not a real integration.
- `server/store.test.ts` literally tests the file-roundtrip behavior: it writes a record via one `PlatformStore` instance, instantiates a second `PlatformStore` pointed at the same directory, and asserts the record survived — confirming this is "a flat file simulating a DB," not an in-memory-only mock.

**Verdict: this is a prototype/demo persistence layer.** It is explicitly **not** production-durable at any meaningful scale: single file, no concurrency control, full-file rewrite per write, no replication, no point-in-time recovery beyond manual on-demand JSON copies, and a genuine lost-update race if two admins write concurrently (both read-modify-write the full snapshot; the second write silently discards the first's change). This is precisely the motivation for the MySQL migration this assessment plans for.

---

## 2. Full API Endpoint Inventory

Auth model: `eternal_admin_session` HttpOnly cookie **or** `Authorization: Bearer` header, both carrying an HMAC-SHA256-signed, expiring token verified via `authenticateAdmin()`, either directly or via a `requireModule(moduleId, action)` middleware that also checks the RBAC permission tables in `server/rbac.ts`.

| Method | Path | Auth |
|---|---|---|
| POST | `/api/voice/synthesize` | Public |
| POST | `/api/voice/parse-registration` | Public |
| GET | `/api/public/cms` | Public |
| POST | `/api/public/registrations` | Public |
| POST | `/api/public/volunteers` | Public |
| GET | `/api/payments/gateway-status` | Public |
| GET | `/api/public/payments/:referenceCode/status` | Public |
| POST | `/api/public/payments/create-order` | Public |
| POST | `/api/payments/webhook` | HMAC signature (Razorpay/Stripe/custom secret) |
| GET | `/api/admin/session` | Admin |
| POST | `/api/admin/login` | Public, rate-limited (12/10min per IP+email, in-memory) |
| POST | `/api/admin/logout` | Admin |
| GET | `/api/admin/dashboard` | `overview:read` |
| GET/POST/PATCH/DELETE | `/api/admin/participants(/export, /:id)` | `participants:*` |
| GET | `/api/admin/payments` | `payments:read` |
| POST | `/api/admin/payments/refund` | `payments:write` |
| GET/POST/PATCH | `/api/admin/volunteers(/:id)` | `volunteers:*` |
| GET/POST | `/api/admin/memberships` | `membership:*` (no PATCH/DELETE exists) |
| GET/POST/PATCH/DELETE | `/api/admin/media(/:id)` | manual `authenticateAdmin` + per-kind permission |
| GET/POST/PATCH/DELETE | `/api/admin/cms(/:id)` | manual `authenticateAdmin` |
| GET | `/api/admin/pages` | `websiteInventory:read` |
| GET | `/api/admin/public-preview` | `pageBuilder:read` |
| PUT | `/api/admin/pages/:id` | manual auth (draft/publish mode) |
| POST | `/api/admin/pages/sync-all` | manual auth |
| GET | `/api/admin/revisions` | `pageBuilder:read` |
| POST | `/api/admin/revisions/:id/restore` | manual auth |
| GET/PUT | `/api/admin/carousels(/:id)` | `carousels:read` / manual |
| GET/POST/PATCH/DELETE (+`/:id/replace`) | `/api/admin/media-assets` | manual `authenticateAdmin` |
| GET/PUT/POST/PATCH/DELETE | `/api/admin/scripture(/chapters/:num, /verses, /verses/:id)` | `scripture:*` |
| GET/PUT | `/api/admin/story/scenes(/:id)` | `story:*` |
| GET | `/api/admin/story/inspect-glbs` | `story:read` |
| GET/POST/PATCH/DELETE | `/api/admin/collections/:kind(/:id)` | manual auth, module resolved per-kind |
| GET/POST/PATCH | `/api/admin/users(/:id)` | `users:*` |
| GET | `/api/admin/audit` | `audit:read` |
| GET/PATCH | `/api/admin/settings` | `settings:*` |
| POST | `/api/admin/backups`, `/api/admin/backups/restore` | manual auth |
| GET | `/api/chapters/:chapter/recitation` | Public (`server.ts`) |
| GET | `/api/story/:scene/narration` | Public (`server.ts`) |
| GET | `/api/welcome/narration` | Public (`server.ts`) |

---

## 3. Entities Currently Modeled

All fields below are copied directly from the existing TypeScript interfaces in `server/store.ts` and `src/utils/cmsSync.ts` — nothing invented.

- **AdminUserRecord**: id, name, email, role (8-value enum), passwordHash (`salt:scrypt-hex`), active, createdAt, lastLoginAt.
- **ParticipantRecord**: id, fullName, email, phone, noOfPersons, donationAmountInr, registrationType, country, city, assistance{visa, accommodation, localTransport}, events{curtainRaiser, mahotsav}, preferredLanguage?, familyOrGroupMembers?, organisationName?, organisationRole?, volunteerSkills?, parayanaCity?, assistanceNotes?, verificationStatus (enum), paymentStatus (enum), referenceCode, createdAt.
- **PaymentRecord**: id, participantId, participantName, amountInr, currency ('INR'), gateway (enum), gatewayReference, status (enum), createdAt.
- **RefundRecord**: id, paymentId, amountInr, reason, approvedBy, status (enum), createdAt.
- **VolunteerRecord**: id, fullName, email, phone, country, city, department (enum), volunteerBadgeId, approvalStatus (enum), attendanceCount, createdAt.
- **MembershipRecord**: id, memberName, email, tier (enum), country, status (enum), createdAt.
- **ManagedMediaRecord**: id, kind ('image'|'video'), category (enum), title, description, language, copyright, source, altText, url, focalPoint, published, createdAt.
- **CmsManagedItem**: id, section (17-value enum), title, subtitle, body, language (4-value enum), status (enum), meta (Record<string,string>), updatedAt.
- **AuditLogRecord**: id, timestamp, actorEmail, actorRole, action, module, targetId, summary.
- **SystemSettingsRecord** (singleton, no id): registrationOpen, requireVolunteerApproval, maintenanceBanner, defaultVoiceGender, backupRetentionDays.
- **PageInventoryRecord**: id, slug, route, name, category (8-value enum), cmsConnected, syncStatus (enum), status (enum), publishedVersion: PageSnapshotPayload, draftVersion: PageSnapshotPayload, hasUnpublishedDraft, updatedAt, publishedAt, updatedBy. `PageSnapshotPayload` nests localized title/subtitle/summary (`{en, hi?, te?}`), `seo{metaTitle, metaDescription, ogImageUrl?}`, and `blocks: PageBlockRecord[]` (14 block types).
- **MediaAssetRecord**: id, assetKey?, kind, category (7-value enum), title, description, altText, caption, copyright, source, language, tags[], url, focalPoint, featured, published, usageLocations[], createdAt, updatedAt.
- **CarouselConfigRecord / CarouselSlideConfig**: carousel has id, name, placement, autoAdvanceMs, publishedSlides[], draftSlides[]; each slide: id, assetKey?, mediaAssetId?, src, mobileSrc?, title, subtitle, caption?, chapterRef?, alt, objectPosition?, order, enabled.
- **ScriptureChapterOverride**: chapterNumber, titleEn, titleSanskrit, titleHi?, titleTe?, summaryEn, summaryHi?, summaryTe?, keyTeaching, featuredVerseRef, verseCount, audioUrl?, status, updatedAt.
- **ScriptureVerseRecord**: id, chapterNumber, verseNumber, sanskritDevanagari, transliteration, translationEn, translationHi, translationTe, commentaryNote, audioUrl?, status, updatedAt.
- **StorySceneOverride**: id, sceneNumber, title{en,hi,te}, chapterTag, dialogue{en,hi,te}, narration{en,hi,te}, primaryImageUrl, audioUrl?, status, updatedAt.
- **StructuredCollectionItem**: id, kind (events/schedule/participation/leadership/partners/announcements/faqs), title, subtitle, description, dateLabel?, locationLabel?, badgeLabel?, href?, imageUrl?, language, order, featured, status, meta (Record<string,string>), updatedAt.
- **ContentRevisionRecord**: id, entityType (5-value enum), entityId, entityTitle, action (4-value enum), actorEmail, summary, snapshotJson (full stringified snapshot), createdAt. Capped at 500 most-recent entries.

---

## 4. MySQL Target Architecture — Recommendation

**ORM: Drizzle ORM + `mysql2`.** Not Prisma. Justification specific to this codebase: every data shape in this project is a plain, hand-written TypeScript `interface` with string-literal union enums — no decorators, no classes, no existing code-generation step anywhere in the build (`tsx`/esbuild run the server directly). Drizzle's schema is itself plain TypeScript objects/functions that run through the exact same `tsx`/esbuild pipeline with no extra build step, and its `mysqlEnum(...)` helper maps directly onto the string-literal unions already used throughout `store.ts`. Prisma would require an added `prisma generate` step and a heavier generated client that doesn't match this project's "no codegen" convention anywhere else.

### Proposed schema (derived directly from the entities in §3)

```sql
admin_users        (id PK, name, email UNIQUE, role ENUM(8), password_hash, active, created_at, last_login_at)

participants       (id PK, full_name, email, phone, no_of_persons, donation_amount_inr, registration_type,
                     country, city, assistance_visa, assistance_accommodation, assistance_local_transport,
                     events_curtain_raiser, events_mahotsav, preferred_language NULL, family_or_group_members NULL,
                     organisation_name NULL, organisation_role NULL, volunteer_skills NULL, parayana_city NULL,
                     assistance_notes NULL, verification_status ENUM, payment_status ENUM,
                     reference_code UNIQUE, created_at)

payments            (id PK, participant_id FK -> participants.id, participant_name, amount_inr, currency,
                     gateway ENUM, gateway_reference, status ENUM, created_at)  -- INDEX(participant_id)

refunds             (id PK, payment_id FK -> payments.id, amount_inr, reason, approved_by, status ENUM, created_at)

volunteers          (id PK, full_name, email, phone, country, city, department ENUM,
                     volunteer_badge_id UNIQUE, approval_status ENUM, attendance_count, created_at)

memberships         (id PK, member_name, email, tier ENUM, country, status ENUM, created_at)

media_assets        (id PK, asset_key NULL UNIQUE, kind ENUM, category ENUM, title, description, alt_text,
                     caption, copyright, source, language, url, focal_point, featured, published,
                     created_at, updated_at)
media_asset_tags    (media_asset_id FK, tag)              -- normalizes tags[]
media_usage         (media_asset_id FK, location)         -- normalizes usageLocations[]

pages               (id PK, slug UNIQUE, route UNIQUE, name, category ENUM, cms_connected, sync_status ENUM,
                     status ENUM, has_unpublished_draft, updated_at, published_at NULL, updated_by)
page_versions       (id PK, page_id FK -> pages.id, version_kind ENUM('published','draft'),
                     title_json JSON, subtitle_json JSON, summary_json JSON, seo_json JSON)
page_blocks         (id PK, page_version_id FK -> page_versions.id, type ENUM(14), label, `order`,
                     visible, payload JSON)

carousels           (id PK, name, placement, auto_advance_ms)
carousel_slides     (id PK, carousel_id FK -> carousels.id, version_kind ENUM('published','draft'),
                     src, mobile_src NULL, title, subtitle, caption NULL, chapter_ref NULL, alt,
                     object_position NULL, `order`, enabled)

scripture_chapters  (chapter_number PK, title_en, title_sanskrit, title_hi, title_te, summary_en, summary_hi,
                     summary_te, key_teaching, featured_verse_ref, verse_count, audio_url NULL, status, updated_at)
scripture_verses    (id PK, chapter_number FK -> scripture_chapters, verse_number, sanskrit_devanagari,
                     transliteration, translation_en, translation_hi, translation_te, commentary_note,
                     audio_url NULL, status, updated_at)  -- UNIQUE(chapter_number, verse_number)

story_scenes        (id PK, scene_number UNIQUE, title_en, title_hi, title_te, chapter_tag,
                     dialogue_en, dialogue_hi, dialogue_te, narration_en, narration_hi, narration_te,
                     primary_image_url, audio_url NULL, status, updated_at)

collections         (id PK, kind ENUM(7), title, subtitle, description, date_label NULL, location_label NULL,
                     badge_label NULL, href NULL, image_url NULL, language ENUM, `order`, featured, status,
                     updated_at)
collection_meta      (collection_id FK, meta_key, meta_value)   -- normalizes meta Record<string,string>

revisions           (id PK, entity_type ENUM(5), entity_id, entity_title, action ENUM(4), actor_email,
                     summary, snapshot_json JSON, created_at)   -- INDEX(entity_type, entity_id, created_at)

audit_logs          (id PK, timestamp, actor_email, actor_role, action, module, target_id, summary)
                     -- INDEX(timestamp), INDEX(actor_email)

revoked_tokens       (token_hash PK, expires_at)    -- NEW: replaces the in-memory-only revocation Map

system_settings     (id=1 singleton row: registration_open, require_volunteer_approval, maintenance_banner,
                     default_voice_gender, backup_retention_days)

cms_items            (id PK, section ENUM(17), title, subtitle, body, language ENUM, status ENUM,
                     meta JSON, updated_at)
```

**Foreign keys:** `payments.participant_id → participants.id`, `refunds.payment_id → payments.id`, `scripture_verses.chapter_number → scripture_chapters.chapter_number`, `carousel_slides.carousel_id → carousels.id`, `page_versions.page_id → pages.id`, `page_blocks.page_version_id → page_versions.id`.
**Unique indexes:** `participants.reference_code`, `admin_users.email`, `pages.slug`/`pages.route`, `scripture_verses(chapter_number, verse_number)`, `volunteers.volunteer_badge_id`.

**Transactions:** wrap every multi-table write in a single `db.transaction(...)` — most importantly "publish a page" (write `page_versions` + flip `pages.status`/`published_at` + insert a `revisions` row), which today is three separate in-memory mutations saved as one file write with no atomicity guarantee beyond "the whole file either saved or didn't."

**Connection pooling:** `mysql2/promise` `createPool()`, connection limit tuned to the host's `max_connections`, configured via a `DATABASE_URL` env var (or discrete `DB_HOST`/`DB_USER`/`DB_PASS`/`DB_NAME`).

**Migrations/versioning:** `drizzle-kit` generating timestamped SQL migration files checked into `server/db/migrations/`, applied via `drizzle-kit migrate` in the deploy pipeline. **There is zero migration tooling in the repo today** — this is entirely new infrastructure, not a replacement for something that exists.

**Auth/session/RBAC mapping:** `admin_users` table replaces `AdminUserRecord[]`. Session tokens themselves stay as they are today (HMAC-signed, stateless, already well-implemented — see Bugs & Risks doc) but the **in-memory-only revocation Map should become the `revoked_tokens` table above**, so logout survives a restart and works across multiple server instances — this is a real functional gap today, not just a database nicety. RBAC's static permission tables (`ROLE_READ_MODULES`/`ROLE_WRITE_MODULES` in `server/rbac.ts`) are small and static; they can stay as code and do not need to move into the database.

---

## 5. Migration Path From Current State to MySQL

**There is nothing to migrate in terms of real user data in this checkout.** `.data/platform-db.json` on the audit machine was generated fresh during this session — `participants`, `payments`, `refunds`, `volunteers`, `memberships`, `media`, `cmsItems`, `auditLogs`, and `revisions` all start as empty arrays. Only one bootstrap admin user and the canonical seed/content rows (sourced from `src/content/*.ts` and `src/utils/cmsSync.ts` constants) exist.

**If a real production deployment of this app already has a `.data/platform-db.json` with live registrations/payments, that specific file is the only thing requiring a careful, real data migration — this was not observed in this checkout and must be confirmed against the actual production host before assuming zero risk.**

### Step-by-step task list

1. Stand up the MySQL 8 schema above via `drizzle-kit` migrations.
2. Write a one-off migration script: read `.data/platform-db.json` (if a real production copy exists) and bulk-insert into each MySQL table, **preserving the original string IDs** (e.g. `usr-super-1`, `reg-1`) as primary keys to avoid duplicate or renumbered records.
3. Re-point `server/store.ts`'s consumers (`server/routes.ts`, `server.ts`) at a new `server/db.ts` module exposing equivalent method shapes, so route handlers change minimally.
4. Keep the existing JSON-backup mechanism as a *secondary* export-to-JSON safety net even after MySQL is live, or replace it with `mysqldump`-based backups driven by the (currently unenforced) `backupRetentionDays` setting.
5. Validate that existing seed data won't violate new uniqueness constraints (e.g. confirm no duplicate `reference_code`s before adding the `UNIQUE` index).
6. Adapt `server/store.test.ts` and `server/routes.test.ts` (which currently use `fs.mkdtempSync` + a temp directory for setup/teardown) to use a test schema with transaction rollback instead.

**Risk of data loss: low**, specifically because the current storage has effectively no real production data captured — but this must be reconfirmed against any real, externally-deployed `.data/platform-db.json` before migrating, since this audit only had access to a local, freshly-seeded checkout.

---

## 6. Backup, Recovery, and Transaction Logic Today

- **Backup**: manual, on-demand only (`POST /api/admin/backups`), full-JSON snapshot, no scheduling, no retention enforcement despite the `backupRetentionDays` setting field existing.
- **Recovery**: `POST /api/admin/backups/restore` validates only that the restored file's `users` field is an array before swapping the entire in-memory database — no partial or table-level restore is possible.
- **Transactions**: **none exist.** Every mutation is "change the in-memory JS object, then rewrite the whole file." Two concurrent admin writes racing will both read-modify-write the full snapshot, and the second write silently wins, discarding the first's change — a real correctness gap under concurrent use today, not just a theoretical concern for a future, larger admin team.
