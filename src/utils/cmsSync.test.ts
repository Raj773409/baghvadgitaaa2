import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  buildAdminNotifications,
  CANONICAL_CAROUSELS,
  CANONICAL_PUBLIC_PAGES,
  computeMediaUsageLocations,
  filterPublishedPages,
  filterRecordsByDateRange,
  paginateRecords,
  replaceMediaReferences,
  resolveLocalizedText,
  resolvePageForRoute,
  resolvePageSnapshot,
  resolvePublishedHeroSlides,
  resolvePublishedSpiritualSlides,
} from './cmsSync';
import { inspectAllStoryGlbs } from '../../server/glbInspector';

test('Canonical public page inventory contains all 28 website routes', () => {
  assert.equal(CANONICAL_PUBLIC_PAGES.length, 28);
  const routes = new Set(CANONICAL_PUBLIC_PAGES.map((p) => p.route));
  assert.equal(routes.size, 28);
  assert.ok(routes.has('/'));
  assert.ok(routes.has('/about'));
  assert.ok(routes.has('/gita'));
  assert.ok(routes.has('/participate/register'));
  assert.ok(routes.has('/cancellation-refund-policy'));
  assert.ok(routes.has('/story'));
});

test('Draft isolation hides unpublished draft edits from public resolution until published', () => {
  const pages = JSON.parse(JSON.stringify(CANONICAL_PUBLIC_PAGES)) as typeof CANONICAL_PUBLIC_PAGES[number][];
  const about = pages.find((p) => p.slug === 'about')!;
  about.draftVersion.title.en = 'Staged Draft About Headline';
  about.hasUnpublishedDraft = true;

  // Public consumer receives publishedVersion, not staged draftVersion
  const publicRecord = resolvePageForRoute(pages, '/about');
  assert.ok(publicRecord);
  const publicSnapshot = resolvePageSnapshot(publicRecord, false);
  assert.equal(publicSnapshot?.title.en, 'About Bhagavad Gita Vishwa Mahotsav 2027');

  // Admin preview can opt into draftVersion
  const draftSnapshot = resolvePageSnapshot(publicRecord, true);
  assert.equal(draftSnapshot?.title.en, 'Staged Draft About Headline');

  // Whole page marked as draft is excluded from filterPublishedPages
  about.status = 'draft';
  assert.equal(filterPublishedPages(pages).some((p) => p.slug === 'about'), false);
  assert.equal(resolvePageForRoute(pages, '/about'), null);
});

test('Localized block copy resolves EN, HI, and TE cleanly with fallback', () => {
  const home = CANONICAL_PUBLIC_PAGES.find((p) => p.slug === 'home')!;
  assert.equal(resolveLocalizedText(home.publishedVersion.title, 'en', 'Fallback'), 'Bhagavad Gita Vishwa Mahotsav 2027');
  assert.equal(resolveLocalizedText(home.publishedVersion.title, 'hi', 'Fallback'), 'भगवद्गीता विश्व महोत्सव 2027');
  assert.equal(resolveLocalizedText(home.publishedVersion.title, 'te', 'Fallback'), 'భగవద్గీత విశ్వ మహోత్సవం 2027');
  assert.equal(resolveLocalizedText(undefined, 'te', 'Fallback'), 'Fallback');
});

test('Carousel resolvers merge enabled slides sorted by order and propagate published overrides', () => {
  const carousels = JSON.parse(JSON.stringify(CANONICAL_CAROUSELS)) as typeof CANONICAL_CAROUSELS[number][];
  const spiritual = carousels.find((c) => c.id === 'hero-spiritual')!;
  spiritual.autoAdvanceMs = 7400;
  spiritual.publishedSlides[0].caption = 'Updated Spiritual Caption';
  spiritual.publishedSlides[1].enabled = false;

  const baseSlides = spiritual.publishedSlides.map((s) => ({
    id: s.id,
    src: `/static/${s.assetKey}.jpg`,
    title: s.title,
    caption: s.caption ?? s.title,
    subtitle: s.subtitle,
    chapterRef: s.chapterRef ?? 'Gita',
    alt: s.alt,
    objectPosition: s.objectPosition,
  }));

  const resolved = resolvePublishedSpiritualSlides(
    baseSlides,
    carousels,
    (k, direct) => direct || `/resolved/${k}.jpg`,
  );

  assert.equal(resolved.autoAdvanceMs, 7400);
  assert.equal(resolved.slides.length, baseSlides.length - 1);
  assert.equal(resolved.slides[0].caption, 'Updated Spiritual Caption');

  const mainHero = resolvePublishedHeroSlides(
    baseSlides,
    carousels,
    (k, direct) => direct || `/resolved/${k}.jpg`,
  );
  assert.equal(mainHero.length, 8);
});

test('Media usage calculation and asset replacement propagate across pages and carousels', () => {
  const pages = JSON.parse(JSON.stringify(CANONICAL_PUBLIC_PAGES)) as typeof CANONICAL_PUBLIC_PAGES[number][];
  const carousels = JSON.parse(JSON.stringify(CANONICAL_CAROUSELS)) as typeof CANONICAL_CAROUSELS[number][];

  pages[0].publishedVersion.blocks[0].mediaAssetId = 'med-pavilion';
  pages[0].publishedVersion.blocks[0].mediaUrl = '/uploads/old-pavilion.jpg';

  const locations = computeMediaUsageLocations(
    { id: 'med-pavilion', assetKey: 'heroPavilion', url: '/uploads/old-pavilion.jpg' },
    pages,
    carousels,
  );
  assert.ok(locations.some((loc) => loc.includes('Carousel:')));
  assert.ok(locations.some((loc) => loc.includes('Page: Homepage')));

  const result = replaceMediaReferences({
    assetId: 'med-pavilion',
    assetKey: 'heroPavilion',
    oldUrl: '/uploads/old-pavilion.jpg',
    newUrl: '/uploads/new-pavilion.jpg',
    newAltText: 'Refined pavilion photography',
    pages,
    carousels,
  });

  assert.equal(result.updatedPagesCount, 1);
  assert.ok(result.updatedSlidesCount >= 1);
  assert.equal(pages[0].publishedVersion.blocks[0].mediaUrl, '/uploads/new-pavilion.jpg');
  assert.equal(carousels[0].publishedSlides[0].src, '/uploads/new-pavilion.jpg');
});

test('Date-range filtering, pagination, and real admin notification generator work deterministically', () => {
  const now = Date.parse('2026-06-15T12:00:00.000Z');
  const records = [
    { id: '1', createdAt: '2026-06-14T10:00:00.000Z' },
    { id: '2', createdAt: '2026-06-01T10:00:00.000Z' },
    { id: '3', createdAt: '2026-04-01T10:00:00.000Z' },
  ];

  assert.equal(filterRecordsByDateRange(records, 'all', now).length, 3);
  assert.equal(filterRecordsByDateRange(records, '7d', now).length, 1);
  assert.equal(filterRecordsByDateRange(records, '30d', now).length, 2);

  const page2 = paginateRecords([1, 2, 3, 4, 5], 2, 2);
  assert.deepEqual(page2.items, [3, 4]);
  assert.equal(page2.totalPages, 3);

  const notifs = buildAdminNotifications({
    pendingParticipants: 2,
    flaggedParticipants: 1,
    pendingVolunteers: 3,
    unpublishedDraftPages: 1,
    unpublishedDraftCarousels: 0,
    gatewayConfigured: false,
  });
  assert.equal(notifs.length, 5);
  assert.equal(notifs[0].severity, 'action-required');
});

test('GLB binary inspector verifies all 8 character rigs on disk', () => {
  const results = inspectAllStoryGlbs(path.resolve(process.cwd()));
  assert.equal(results.length, 8);
  for (const r of results) {
    assert.equal(r.exists, true, `${r.id} missing on disk`);
    assert.equal(r.validGlb, true, `${r.id} invalid glTF header`);
    assert.ok(r.byteLength > 1000, `${r.id} unexpectedly small`);
    assert.ok(r.meshesCount >= 1, `${r.id} missing meshes`);
  }
  const krishna = results.find((r) => r.id === 'krishna')!;
  assert.ok(krishna.animationCount >= 10);
  assert.ok(krishna.morphTargetCount >= 11);
});
