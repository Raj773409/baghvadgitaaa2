# PROJECT ETERNAL — ROUTE AND CONTENT INVENTORY

All routes, sections, assets, and content sources discovered by direct source inspection. **[VERIFIED]** unless tagged **[INFERRED]** or **[ASSUMPTION]**.

## Architecture baseline

- `src/app/routes.tsx` — a single `react-router-dom` `<Routes>` tree inside `BrowserRouter`, wrapped by `ThemeProvider` → `I18nProvider` (`src/App.tsx`). No route-level auth guards except the admin pages, which are `lazy()`-loaded.
- `src/hooks/usePublicCms.ts` fetches `GET /api/public/cms` once (module-level cache + subscriber pattern) and exposes `usePublicCms()`, `usePublishedPage()`, `usePublishedCollections(kind)`. This is the **only** bridge from the admin CMS to public pages.
- `src/content/siteCatalog.ts`'s `extractPublishedPageDetails(pages, route, locale)` lets a page override its hero eyebrow/title/subtitle and inject extra page-builder blocks if an admin has published a `PageInventoryRecord` for that route. Everything else per page is hardcoded in `.tsx`/`.ts` files unless the page explicitly also calls `usePublishedCollections('<kind>')`.
- There is **no separate `MobileNavigation.tsx`** — mobile and desktop share one full-screen overlay nav (`MoreMenuOverlay.tsx`, triggered from `Header.tsx`'s "MORE" button).
- **No dead internal links were found** anywhere in the files read — every `<Link to="...">` destination resolves to a real registered route.

---

## Route-by-Route Inventory

### `/` — HomePage — **Partially functional**
Sections in order: `Hero` → `EventCountdown` → `EventIntroduction` → `WhyParticipateSection` → `EternalMessage` → `GitaBook3DShowcaseSection` → `ChapterExplorer` → `GlobalJourney` → `EventTimeline` → `LeadershipSection` → `PartnershipSection` → `CulturalGallerySection` → `MediaSection` → `BePartOfGlobalMovementSection` → `ParticipationSection` → `Footer`.

- **CMS-driven**: `Hero` (carousel slides, hero text override, `cmsItems` sections `hero`/`krishnaFeature`); `WhyParticipateSection` (scripture verses, `home-why` block override); `ChapterExplorer`/`ChaptersGridSection` (chapter overrides); `CulturalGallerySection` (media assets + extra items); `BePartOfGlobalMovementSection` (reads `cmsItems` section `participationCategories`, but the 10-pathway grid itself stays the hardcoded `MOVEMENT_TEN_PATHWAYS` array).
- **Hardcoded, not admin-editable**: `EventIntroduction` (metric labels, `STATIC_PARTICIPANT_STATEMENT = '50,000+'` literal); `EternalMessage` (`APPROVED_ETERNAL_QUOTE = null` — the quote block is permanently empty **by design**, pending organizer approval, not a bug); `EventTimeline` (`PUBLISHED_MILESTONES` array); `MediaSection` (3 static images, no CMS hook at all); `ParticipationSection` (static CTA copy); **`LeadershipSection` and `PartnershipSection`** — see critical finding below.
- **CRITICAL FINDING**: `APPROVED_LEADERSHIP_RECORDS = []` and `APPROVED_PARTNER_RECORDS = []` are hardcoded, permanently-empty arrays in `src/content/eventContent.ts`. `LeadershipSection.tsx` and `PartnershipSection.tsx` filter `.approved` on these static arrays and **never call `usePublicCms`/`usePublishedCollections`**. Result: the homepage's embedded Leadership and Partnership sections will permanently show their "awaiting organizer release" empty state, even after an admin publishes leadership/partner records through the CMS — because the *dedicated* `/leadership` and `/partners` pages correctly call `usePublishedCollections('leadership'|'partners')`, but the homepage's embedded sections do not. Two different data paths for the same content type depending on which page renders it.
- Images: `ASSET_MANIFEST.visualStudies.*` all resolve to real bundled files, confirmed present in `src/assets/images/`. No missing-asset references found.
- Forms: `BePartOfGlobalMovementSection`'s volunteer form POSTs to `/api/public/volunteers` — a real network call with success/error handling, not a mock.
- Mobile responsiveness: consistent `sm:`/`lg:` Tailwind breakpoints throughout every section read.

### `/about`, `/mahotsav` (alias) — AboutPage — **Functional, mostly hardcoded**
CMS override only for one named block (`about-stewardship`, heading/body) plus hero title/eyebrow/lead. Everything else — the Four Yoga Pillars grid, the "Architecture of Eighteen" stat grid, and the full Content Parity & Readiness Matrix table (110 lines) — is hardcoded, locale-ternary text baked into the component. Links to `/gita`, `/leadership`, `/global-journey`, `/participate/register` all verified to exist.

### `/gita` — GitaPage — **Functional, hybrid**
Chapter data merges a 497-line static catalog with `publicCms.scriptureChapters` admin overrides (title/essence/verseCount/audio, per language, per chapter) — genuine CMS integration at the field level. Embeds the real 3D Gita Book, chapter grid, scripture experience, and chapter explorer. Chapter recitation audio fetched from a real server route (`/api/chapters/:chapter/recitation`), not a stub. `?chapter=N` query param is validated (1–18) and auto-scrolls to the right dossier.

**Content coverage caveat** (from the 3D/media research pass): the underlying scripture data holds **one representative verse per chapter** (18 chapters total), not the full canonical ~700-shloka text that the homepage markets ("700 Shlokas · 18 Chapters"). The 3D book engineering is real; the scripture data behind it is a curated excerpt, not the complete text.

### `/story` — StoryPage (lazy-loaded) — **Reachable, but orphaned from primary navigation**
Route exists and lazy-loads correctly with a real loading fallback. **Confirmed absent from both `MORE_MENU_ITEMS` (the global nav overlay) and `SITEMAP_EXPANSION_LINKS` (the footer)** via grep across `navigationContent.ts`. Only discoverable via direct CTA links inside `Hero.tsx`, `HeroContent.tsx`, and `EventIntroduction.tsx` on the homepage — a user who lands on any other page and opens "MORE" or the footer has no path to it.

The 3D story engine itself (character rigs, facial animation, camera system) is genuinely sophisticated — see §10 of the main audit report and the Feature Matrix for the detailed, binary-verified breakdown. It is not covered again here since this document's scope is route/content, not engine internals.

### `/global-journey`, `/global-journey/18-countries` (alias) — GlobalJourneyPage — **Functional**
Static scale-bar metrics (including the same hardcoded `STATIC_PARTICIPANT_STATEMENT` literal), embedding the full `GlobalJourney` 3D section (real interactive globe/atlas toggle). `PARTICIPATING_COUNTRIES` is a static list of 18, each with descriptive copy keyed to i18n; `countryContent.ts` is only 38 lines for 18 countries, suggesting most per-country summaries are placeholder/fallback text rather than real, verified copy **[INFERRED — would require checking each country record individually to confirm]**. Hero title/eyebrow overridable via CMS; body content otherwise fully static.

### `/program`, `/programme` (alias) — ProgramPage — **Functional, real merge logic**
Clean three-tier merge: static base events/schedule, extended/overridden by `usePublishedCollections('events'|'schedule')`. One of the better-implemented CMS integrations in the project — admin-added events that don't exist in the static base are correctly synthesized into the full event record shape. All CTAs correctly point to `/participate/register`.

### `/participate` — ParticipationHubPage — **Functional, real form**
`PARTICIPATION_PATHWAYS` (6 primary tracks) merge with `usePublishedCollections('participation')`; `MOVEMENT_TEN_PATHWAYS` (10-pathway directory) is **always static**, no CMS path — the same gap pattern as the homepage. Volunteer Seva form is a real `POST /api/public/volunteers` call with success (badge ID) and error handling — functionally complete, not a mock, but it is a **duplicate implementation** of the same form embedded in the homepage's `BePartOfGlobalMovementSection` (code duplication, not a correctness bug, but worth a refactor). The Hospitality terms block is fully hardcoded locale-ternary text citing a specific versioned legal claim ("ASF Charter · 2026-11-05") embedded directly in component code rather than a managed policy document.

### `/participate/register`, `/register` (alias) — RegistrationPage — **Functional, complex, verified end-to-end**
Full multi-step wizard with real client-side draft persistence, voice assistant integration, a payment handoff modal, and policy notice popups. `?type=<id>` deep-links correctly jump to step 3 and preselect the registration type. The complete submission → validation → API → persistence → payment-handoff pipeline is documented in full in the main audit report and feature matrix (registration is **fully functional and real**; payment capture is **not implemented** — see those documents for the detailed trace).

A documentation/code mismatch was found: `contentParityChecklist.ts` claims `InstitutionalNoticeModal` is also used on `ContactFaqPage`/`Footer`, but it is actually wired only into `RegistrationPage` — those other two pages link directly to the full policy routes instead. Stale documentation, not a functional bug.

### `/leadership` — LeadershipPage — **Functional, correctly CMS-wired**
`VERIFIED_ORGANISING_COMMITTEE` (static fallback) is replaced wholesale by `usePublishedCollections('leadership')` when non-empty — the **correct** pattern, in contrast to the homepage's `LeadershipSection` bug above. Note: this page also re-embeds the same `LeadershipSection` component further down the page, so the real committee list appears correctly at the top, then the **always-empty** static-only section repeats the same gap a second time, visible on this one page.

### `/partners` — PartnersPage — **Functional, correctly CMS-wired**
Same pattern as Leadership: `VERIFIED_ORGANIZING_PARTNERS` (2 static orgs) is replaced by `usePublishedCollections('partners')` when present; also re-embeds the always-empty `PartnershipSection` further down the page.

### `/media`, `/media/upcoming` (alias) — MediaPage — **Functional, best CMS coverage of any page**
Genuinely merges the `media`, `mediaAssets`, and `announcements` collections plus the legacy `cmsItems` section `news` — the most complete CMS integration found anywhere in the project. 5 "visual study" photographs are hardcoded (all verified to exist as real files). `OFFICIAL_ANNOUNCEMENTS` (a static array) is always appended **after** any CMS announcements, never replaced — so static announcements can be added-to but never removed or edited by an admin.

### `/contact`, `/connect` (alias), `/faqs` — ContactFaqPage — **Functional**
FAQs: a static `OFFICIAL_FAQS` array merged by ID with `usePublishedCollections('faqs')` — admins can add or override entries by matching ID, the correct pattern. Contact details (`OFFICIAL_SECRETARIAT_CONTACT` — address, phones, emails) are **100% hardcoded**, not CMS-editable anywhere on this page. Links to all three policy routes verified to exist.

### `/privacy-policy`, `/terms-conditions` / `/terms` (alias), `/cancellation-refund-policy` / `/refund-policy` (alias) — PolicyPage — **Functional, fully hardcoded legal text**
`OFFICIAL_POLICY_DOCUMENTS` (a 447-line content file) is the **sole source of all legal text** for all three policies, in all three languages — zero admin editability beyond the page title/hero override. **Any policy change (e.g. refund terms) requires a code deploy, not a CMS publish.** Flagged as a priority CMS gap given legal/compliance sensitivity.

### `/admin`, `/admin/login`, `/admin/access-denied`, `/admin/*` — lazy-loaded
Out of this document's scope (fully covered in the Feature Matrix and main audit report §5). One navigation note relevant here: both `Footer.tsx` and `MoreMenuOverlay.tsx` expose a public, unauthenticated-looking "Admin Portal"/"Admin Command Centre" link directly to `/admin` from every page — worth weighing against the security findings on login rate limiting and default credentials in `PROJECT_ETERNAL_BUGS_AND_RISKS.md`.

### `*` (catch-all) → renders HomePage — **gap, not a crash**
Any mistyped or invalid URL silently shows the homepage instead of a "not found" state. This is an intentional SPA fallback pattern, not a crash, but there is no dedicated 404 page and no visual/semantic signal to the user that they hit an invalid route.

---

## Hardcoded Content Inventory (critical deliverable)

| Content | File(s) | Admin-editable? |
|---|---|---|
| All page hero eyebrow/title/subtitle fallback text | i18n locale files, per-page `t('pages.*')` calls | No — only overridable if an admin has published a matching `PageInventoryRecord`; the fallback text itself is code |
| Secretariat contact (address, phones, emails) | `eventContent.ts: OFFICIAL_SECRETARIAT_CONTACT` | No |
| 18-country list, coordinates, region labels, per-country summaries | `countryContent.ts` (38 lines for 18 countries — likely mostly placeholder copy) | No |
| Event milestones (Curtain Raiser / Main Mahotsav dates & descriptions) | `eventContent.ts: PUBLISHED_MILESTONES` | No |
| "50,000+" participant count | `eventContent.ts: STATIC_PARTICIPANT_STATEMENT` (literal) | No |
| Leadership committee (fallback list) | `eventContent.ts: VERIFIED_ORGANISING_COMMITTEE` | Yes on `/leadership`; **no on the homepage embedded section (bug)** |
| Organizing partners (fallback list) | `eventContent.ts: VERIFIED_ORGANIZING_PARTNERS` | Yes on `/partners`; **no on the homepage embedded section (bug)** |
| 10 Movement Pathways grid | `participationContent.ts: MOVEMENT_TEN_PATHWAYS` | No, on both pages it appears |
| All 3 policy documents, all 3 languages | `faqAndPolicyContent.ts` (447 lines) | No |
| 18-chapter catalog base text (title/essence/Sanskrit), Sanskrit recitations | `scriptureContent.ts` (497 lines), `chapterRecitations.ts` (252 lines) | Partial — per-chapter admin overrides exist and are wired |
| Mahabharata/Story content | `mahabharataWarData.ts` (860 lines), `storyContent.ts` (956 lines) | Partial — scene text/narration overrides exist; 3D composition is not admin-editable |
| Cultural heritage gallery captions | `culturalLibrary.ts` (128 lines) | Partial — asset-key matched overrides exist |
| Content Parity & Readiness Matrix (self-referential audit table on `/about`) | `contentParityChecklist.ts` | No |
| "Eternal Quote" | `eventContent.ts: APPROVED_ETERNAL_QUOTE = null` | N/A — intentionally disabled pending approval, by design |
| Navigation structure (MORE menu, footer sitemap) | `navigationContent.ts` | No |

**Scale**: approximately **4,900+ lines of hardcoded bilingual/trilingual content** across `src/content/*.ts` alone — the large majority of which has no corresponding CMS/admin write path at all. Only a narrow, specific set of fields genuinely round-trip through the CMS without a code deploy: page hero text, specific named content blocks, per-chapter scripture overrides, media assets, and the generic "structured collections" (events/schedule/participation/leadership/partners/announcements/FAQs).

---

## Navigation / Link Integrity Summary

- All `<Link to="...">` destinations checked against `routes.tsx` resolve to real routes — **no dead internal links found**.
- `/story` is a real, working route with **no primary-nav entry point** — reachable only from homepage CTAs.
- `InstitutionalNoticeModal` is documented as used on `ContactFaqPage`/`Footer` but is actually wired only into `RegistrationPage` — stale documentation.
- No `MobileNavigation.tsx` file exists; mobile nav is the same `MoreMenuOverlay` used on desktop (responsive, verified via its breakpoint classes).
- No dedicated 404/not-found page exists anywhere in the route tree.
