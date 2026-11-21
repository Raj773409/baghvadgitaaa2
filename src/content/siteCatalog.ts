import { ASSET_MANIFEST } from '../assets/assetManifest';
import { STORY_ASSET_MANIFEST } from './storyAssets';
import {
  CANONICAL_PUBLIC_PAGES,
  resolveLocalizedText,
  resolvePageForRoute,
  resolvePageSnapshot,
  type AdminLocaleCode,
  type LocalizedTextMap,
  type PageBlockRecord,
  type PageInventoryRecord,
  type PageSnapshotPayload,
} from '../utils/cmsSync';

export const VISUAL_STUDY_SRC_BY_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ASSET_MANIFEST.visualStudies).map(([key, item]) => [key, item.src]),
);

const CANONICAL_PAGE_BY_ID = new Map(CANONICAL_PUBLIC_PAGES.map((p) => [p.id, p]));

/**
 * Resolves any stored CMS media reference:
 *  - `asset://<key>` -> bundled Vite asset URL from ASSET_MANIFEST.visualStudies
 *  - `assetKey` matching ASSET_MANIFEST.visualStudies -> bundled Vite asset URL
 *  - `story:<sceneId>` or `asset://story:<sceneId>` -> local /assets/aistudio/*.png
 *  - `/uploads/...`, `/assets/...`, `https://...`, `data:...` -> passed directly
 */
export function resolveCmsMediaUrl(assetKey?: string, rawUrl?: string): string {
  const cleanUrl = rawUrl?.trim() ?? '';
  if (cleanUrl.startsWith('asset://')) {
    const key = cleanUrl.slice('asset://'.length);
    if (key.startsWith('story:')) {
      const sceneId = key.slice('story:'.length);
      return STORY_ASSET_MANIFEST[sceneId]?.primaryImageSrc ?? '';
    }
    if (VISUAL_STUDY_SRC_BY_KEY[key]) {
      return VISUAL_STUDY_SRC_BY_KEY[key];
    }
  }

  if (cleanUrl && !cleanUrl.startsWith('asset://')) {
    return cleanUrl;
  }

  const cleanKey = assetKey?.trim() ?? '';
  if (cleanKey.startsWith('story:')) {
    const sceneId = cleanKey.slice('story:'.length);
    return STORY_ASSET_MANIFEST[sceneId]?.primaryImageSrc ?? '';
  }
  if (cleanKey && VISUAL_STUDY_SRC_BY_KEY[cleanKey]) {
    return VISUAL_STUDY_SRC_BY_KEY[cleanKey];
  }

  return cleanUrl;
}

function getRawLocaleValue(map: LocalizedTextMap | undefined, locale: AdminLocaleCode): string {
  if (!map) return '';
  if (locale === 'hi') return map.hi?.trim() ?? '';
  if (locale === 'te') return map.te?.trim() ?? '';
  return map.en?.trim() ?? '';
}

/**
 * Returns a published CMS override when it has been customized away from the
 * canonical initial seed for that locale (preserving curated multilingual i18n
 * strings until an editor explicitly publishes a change).
 */
export function pickPublishedText(params: {
  pageId?: string;
  publishedMap?: LocalizedTextMap;
  canonicalMap?: LocalizedTextMap;
  locale: AdminLocaleCode;
  fallback: string;
}): string {
  const publishedLocale = getRawLocaleValue(params.publishedMap, params.locale);
  const canonicalLocale = getRawLocaleValue(params.canonicalMap, params.locale);

  if (publishedLocale && publishedLocale !== canonicalLocale) {
    return publishedLocale;
  }

  if (params.locale !== 'en') {
    const publishedEn = getRawLocaleValue(params.publishedMap, 'en');
    const canonicalEn = getRawLocaleValue(params.canonicalMap, 'en');
    if (publishedEn && publishedEn !== canonicalEn && !publishedLocale) {
      return publishedEn;
    }
  }

  return params.fallback;
}

export function extractPublishedPageDetails(
  pages: ReadonlyArray<PageInventoryRecord> | undefined,
  routeOrSlug: string,
  locale: AdminLocaleCode,
): {
  page: PageInventoryRecord | null;
  snapshot: PageSnapshotPayload | null;
  canonicalSnapshot: PageSnapshotPayload | null;
  blocks: PageBlockRecord[];
  extraBlocks: PageBlockRecord[];
  heroBlock: PageBlockRecord | null;
  canonicalHeroBlock: PageBlockRecord | null;
  pickPageTitle: (fallback: string) => string;
  pickPageSubtitle: (fallback: string) => string;
  pickHeroEyebrow: (fallback: string) => string;
  pickHeroHeading: (fallback: string) => string;
  pickHeroSubheading: (fallback: string) => string;
  getText: (fallback: string, localized?: LocalizedTextMap) => string;
} {
  const page = resolvePageForRoute(pages, routeOrSlug, { includeDrafts: false });
  const snapshot = resolvePageSnapshot(page, false);
  const canonicalPage = page ? CANONICAL_PAGE_BY_ID.get(page.id) ?? null : null;
  const canonicalSnapshot = canonicalPage?.publishedVersion ?? null;

  const blocks = snapshot
    ? [...snapshot.blocks].filter((b) => b.visible).sort((a, b) => a.order - b.order)
    : [];
  const canonicalBlockIds = new Set(canonicalSnapshot?.blocks.map((b) => b.id) ?? []);
  const extraBlocks = blocks.filter((b) => !canonicalBlockIds.has(b.id));

  const heroBlock = blocks.find((b) => b.type === 'hero') ?? null;
  const canonicalHeroBlock =
    canonicalSnapshot?.blocks.find((b) => b.type === 'hero') ?? null;

  return {
    page,
    snapshot,
    canonicalSnapshot,
    blocks,
    extraBlocks,
    heroBlock,
    canonicalHeroBlock,
    pickPageTitle: (fallback: string) =>
      pickPublishedText({
        pageId: page?.id,
        publishedMap: snapshot?.title,
        canonicalMap: canonicalSnapshot?.title,
        locale,
        fallback,
      }),
    pickPageSubtitle: (fallback: string) =>
      pickPublishedText({
        pageId: page?.id,
        publishedMap: snapshot?.subtitle,
        canonicalMap: canonicalSnapshot?.subtitle,
        locale,
        fallback,
      }),
    pickHeroEyebrow: (fallback: string) =>
      pickPublishedText({
        pageId: page?.id,
        publishedMap: heroBlock?.eyebrow,
        canonicalMap: canonicalHeroBlock?.eyebrow,
        locale,
        fallback,
      }),
    pickHeroHeading: (fallback: string) =>
      pickPublishedText({
        pageId: page?.id,
        publishedMap: heroBlock?.heading,
        canonicalMap: canonicalHeroBlock?.heading,
        locale,
        fallback,
      }),
    pickHeroSubheading: (fallback: string) =>
      pickPublishedText({
        pageId: page?.id,
        publishedMap: heroBlock?.subheading,
        canonicalMap: canonicalHeroBlock?.subheading,
        locale,
        fallback,
      }),
    getText: (fallback, localized) => resolveLocalizedText(localized, locale, fallback),
  };
}
