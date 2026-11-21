import { useEffect, useMemo, useState } from 'react';
import type { CulturalArtworkItem } from '../content/culturalLibrary';
import { resolveCmsMediaUrl } from '../content/siteCatalog';
import {
  resolvePageForRoute,
  resolvePageSnapshot,
  type CarouselConfigRecord,
  type MediaAssetRecord,
  type PageBlockRecord,
  type PageInventoryRecord,
  type PageSnapshotPayload,
  type ScriptureChapterOverride,
  type ScriptureVerseRecord,
  type StorySceneOverride,
  type StructuredCollectionItem,
  type StructuredCollectionKind,
} from '../utils/cmsSync';

export interface PublicCmsItem {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  body: string;
  language: 'en' | 'hi' | 'te' | 'sa';
  status: string;
  meta: Record<string, string>;
  updatedAt: string;
}

export interface PublicMediaItem {
  id: string;
  kind: 'image' | 'video';
  category: 'mahabharata' | 'devis' | 'temples' | 'manuscripts' | 'festival' | 'teaser';
  title: string;
  description: string;
  language: string;
  copyright: string;
  source: string;
  altText: string;
  url: string;
  focalPoint: string;
  published: boolean;
  createdAt: string;
}

export interface PublicCmsPayload {
  settings: {
    registrationOpen: boolean;
    maintenanceBanner: string;
    defaultVoiceGender: 'female' | 'male';
  };
  media: PublicMediaItem[];
  cmsItems: PublicCmsItem[];
  pages?: PageInventoryRecord[];
  carousels?: CarouselConfigRecord[];
  mediaAssets?: MediaAssetRecord[];
  scriptureChapters?: ScriptureChapterOverride[];
  scriptureVerses?: ScriptureVerseRecord[];
  storyScenes?: StorySceneOverride[];
  collections?:
    | StructuredCollectionItem[]
    | Partial<Record<StructuredCollectionKind, StructuredCollectionItem[]>>;
}

let cachedPayload: PublicCmsPayload | null = null;
let inflightRequest: Promise<PublicCmsPayload | null> | null = null;
const subscribers = new Set<(payload: PublicCmsPayload | null) => void>();

async function fetchPublicCmsFresh(force = false): Promise<PublicCmsPayload | null> {
  if (!force && cachedPayload) return cachedPayload;
  if (!force && inflightRequest) return inflightRequest;

  const req = fetch('/api/public/cms', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) return null;
      const json = (await res.json()) as PublicCmsPayload;
      cachedPayload = json;
      for (const listener of subscribers) {
        listener(cachedPayload);
      }
      return cachedPayload;
    })
    .catch(() => null)
    .finally(() => {
      if (inflightRequest === req) {
        inflightRequest = null;
      }
    });

  inflightRequest = req;
  return req;
}

/**
 * Invoked after any Admin publish / rollback / collection edit so client-side
 * SPA navigation to public pages immediately receives fresh published CMS data.
 */
export function invalidatePublicCmsCache(): void {
  cachedPayload = null;
  inflightRequest = null;
  void fetchPublicCmsFresh(true);
}

export function mapPublicMediaToArtwork(
  items: ReadonlyArray<PublicMediaItem>,
  mediaAssets?: ReadonlyArray<MediaAssetRecord>,
): CulturalArtworkItem[] {
  const seenIds = new Set<string>();
  const combined: CulturalArtworkItem[] = [];

  for (const m of items) {
    if (m.kind !== 'image') continue;
    seenIds.add(m.id);
    combined.push({
      id: m.id,
      category:
        m.category === 'mahabharata' ||
        m.category === 'devis' ||
        m.category === 'temples' ||
        m.category === 'manuscripts'
          ? m.category
          : 'temples',
      title: m.title,
      description: m.description,
      imageSrc: resolveCmsMediaUrl(undefined, m.url),
      altText: m.altText || m.title,
      aspectRatio: '4:3' as const,
      language: m.language,
      copyright: m.copyright,
      source: m.source,
      publicationStatus: 'Published · Curated Heritage' as const,
      focalPoint: m.focalPoint,
    });
  }

  if (Array.isArray(mediaAssets)) {
    for (const asset of mediaAssets) {
      if (!asset.published || asset.kind !== 'image') continue;
      if (asset.assetKey || seenIds.has(asset.id)) continue;
      combined.push({
        id: asset.id,
        category:
          asset.category === 'mahabharata' ||
          asset.category === 'devis' ||
          asset.category === 'temples' ||
          asset.category === 'manuscripts'
            ? asset.category
            : 'temples',
        title: asset.title,
        description: asset.description || asset.caption,
        imageSrc: resolveCmsMediaUrl(asset.assetKey, asset.url),
        altText: asset.altText || asset.title,
        aspectRatio: '4:3' as const,
        language: asset.language,
        copyright: asset.copyright,
        source: asset.source,
        publicationStatus: 'Published · Curated Heritage' as const,
        focalPoint: asset.focalPoint || '50% 42%',
      });
    }
  }

  return combined;
}

export function usePublicCms(): PublicCmsPayload | null {
  const [data, setData] = useState<PublicCmsPayload | null>(cachedPayload);

  useEffect(() => {
    subscribers.add(setData);
    void fetchPublicCmsFresh(false).then((res) => {
      if (res) setData(res);
    });
    return () => {
      subscribers.delete(setData);
    };
  }, []);

  return data;
}

export function usePublishedPage(routeOrSlug: string): {
  page: PageInventoryRecord | null;
  snapshot: PageSnapshotPayload | null;
  visibleBlocks: PageBlockRecord[];
} {
  const cms = usePublicCms();
  return useMemo(() => {
    const page = resolvePageForRoute(cms?.pages, routeOrSlug, { includeDrafts: false });
    const snapshot = resolvePageSnapshot(page, false);
    const visibleBlocks = snapshot
      ? [...snapshot.blocks].filter((b) => b.visible).sort((a, b) => a.order - b.order)
      : [];
    return { page, snapshot, visibleBlocks };
  }, [cms, routeOrSlug]);
}

export function usePublishedCollections(
  kind: StructuredCollectionKind,
): StructuredCollectionItem[] {
  const cms = usePublicCms();
  return useMemo(() => {
    const raw = cms?.collections;
    if (!raw) return [];
    const list = Array.isArray(raw)
      ? raw.filter((item) => item.kind === kind)
      : raw[kind];
    if (!Array.isArray(list)) return [];
    return [...list]
      .filter((item) => item.status === 'published')
      .sort((a, b) => a.order - b.order);
  }, [cms, kind]);
}
