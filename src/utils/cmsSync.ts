export type PublishStatus = 'draft' | 'pending-review' | 'published';

export type AdminLocaleCode = 'en' | 'hi' | 'te';

export type PageBlockType =
  | 'hero'
  | 'text'
  | 'image'
  | 'image-carousel'
  | 'video'
  | 'scripture'
  | 'event-card'
  | 'participation-card'
  | 'cta'
  | 'gallery'
  | 'timeline'
  | 'leadership'
  | 'partners'
  | 'faq';

export interface LocalizedTextMap {
  en: string;
  hi?: string;
  te?: string;
}

export interface PageBlockRecord {
  id: string;
  type: PageBlockType;
  label: string;
  order: number;
  visible: boolean;
  eyebrow?: LocalizedTextMap;
  heading?: LocalizedTextMap;
  subheading?: LocalizedTextMap;
  body?: LocalizedTextMap;
  ctaPrimaryLabel?: LocalizedTextMap;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: LocalizedTextMap;
  ctaSecondaryHref?: string;
  mediaAssetId?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  carouselId?: string;
  videoUrl?: string;
  scriptureRef?: string;
}

export interface PageSeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl?: string;
}

export interface PageSnapshotPayload {
  title: LocalizedTextMap;
  subtitle: LocalizedTextMap;
  summary: LocalizedTextMap;
  seo: PageSeoConfig;
  blocks: PageBlockRecord[];
}

export interface PageInventoryRecord {
  id: string;
  slug: string;
  route: string;
  name: string;
  category:
    | 'core'
    | 'scripture'
    | 'programme'
    | 'participation'
    | 'governance'
    | 'media'
    | 'support'
    | 'legal';
  cmsConnected: boolean;
  syncStatus: 'cms-synced' | 'static-seeded';
  status: PublishStatus;
  publishedVersion: PageSnapshotPayload;
  draftVersion: PageSnapshotPayload;
  hasUnpublishedDraft: boolean;
  updatedAt: string;
  publishedAt: string | null;
  updatedBy: string;
}

export interface MediaAssetRecord {
  id: string;
  assetKey?: string;
  kind: 'image' | 'video';
  category: 'mahabharata' | 'devis' | 'temples' | 'manuscripts' | 'festival' | 'story' | 'teaser';
  title: string;
  description: string;
  altText: string;
  caption: string;
  copyright: string;
  source: string;
  language: string;
  tags: string[];
  url: string;
  focalPoint: string;
  featured: boolean;
  published: boolean;
  usageLocations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CarouselSlideConfig {
  id: string;
  assetKey?: string;
  mediaAssetId?: string;
  src: string;
  mobileSrc?: string;
  title: string;
  subtitle: string;
  caption?: string;
  chapterRef?: string;
  alt: string;
  objectPosition?: string;
  order: number;
  enabled: boolean;
}

export interface CarouselConfigRecord {
  id: 'hero-main' | 'hero-spiritual' | string;
  name: string;
  placement: string;
  autoAdvanceMs: number;
  transitionStyle: 'slide-rtl' | 'crossfade' | 'cinematic-pan';
  status: PublishStatus;
  publishedSlides: CarouselSlideConfig[];
  draftSlides: CarouselSlideConfig[];
  hasUnpublishedDraft: boolean;
  updatedAt: string;
}

export interface ScriptureChapterOverride {
  chapterNumber: number;
  titleEn: string;
  titleSanskrit: string;
  titleHi?: string;
  titleTe?: string;
  summaryEn: string;
  summaryHi?: string;
  summaryTe?: string;
  keyTeaching: string;
  featuredVerseRef: string;
  verseCount: number;
  audioUrl?: string;
  status: PublishStatus;
  updatedAt: string;
}

export interface ScriptureVerseRecord {
  id: string;
  chapterNumber: number;
  verseNumber: number;
  sanskritDevanagari: string;
  transliteration: string;
  translationEn: string;
  translationHi: string;
  translationTe: string;
  commentaryNote: string;
  audioUrl?: string;
  status: PublishStatus;
  updatedAt: string;
}

export interface StorySceneOverride {
  id: string;
  sceneNumber: number;
  title: LocalizedTextMap;
  chapterTag: string;
  dialogue: LocalizedTextMap;
  narration: LocalizedTextMap;
  primaryImageUrl: string;
  audioUrl?: string;
  status: PublishStatus;
  updatedAt: string;
}

export type StructuredCollectionKind =
  | 'events'
  | 'schedule'
  | 'participation'
  | 'leadership'
  | 'partners'
  | 'announcements'
  | 'faqs';

export interface StructuredCollectionItem {
  id: string;
  kind: StructuredCollectionKind;
  title: string;
  subtitle: string;
  description: string;
  dateLabel?: string;
  locationLabel?: string;
  badgeLabel?: string;
  href?: string;
  imageUrl?: string;
  language: 'en' | 'hi' | 'te' | 'sa';
  order: number;
  featured: boolean;
  status: PublishStatus;
  meta: Record<string, string>;
  updatedAt: string;
}

export interface ContentRevisionRecord {
  id: string;
  entityType: 'page' | 'carousel' | 'scripture-chapter' | 'story-scene' | 'collection';
  entityId: string;
  entityTitle: string;
  action: 'save-draft' | 'publish' | 'restore' | 'sync-backup';
  actorEmail: string;
  summary: string;
  snapshotJson: string;
  createdAt: string;
}

export interface AdminNotificationItem {
  id: string;
  severity: 'info' | 'warning' | 'action-required';
  title: string;
  detail: string;
  targetModule: string;
  timestamp: string;
}

function makePage(params: {
  id: string;
  slug: string;
  route: string;
  name: string;
  category: PageInventoryRecord['category'];
  title: string;
  titleHi?: string;
  titleTe?: string;
  subtitle: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  blocks: PageBlockRecord[];
}): PageInventoryRecord {
  const now = '2026-06-01T00:00:00.000Z';
  const payload: PageSnapshotPayload = {
    title: {
      en: params.title,
      ...(params.titleHi ? { hi: params.titleHi } : {}),
      ...(params.titleTe ? { te: params.titleTe } : {}),
    },
    subtitle: { en: params.subtitle },
    summary: { en: params.summary },
    seo: {
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
    },
    blocks: params.blocks,
  };

  return {
    id: params.id,
    slug: params.slug,
    route: params.route,
    name: params.name,
    category: params.category,
    cmsConnected: true,
    syncStatus: 'cms-synced',
    status: 'published',
    publishedVersion: JSON.parse(JSON.stringify(payload)) as PageSnapshotPayload,
    draftVersion: JSON.parse(JSON.stringify(payload)) as PageSnapshotPayload,
    hasUnpublishedDraft: false,
    updatedAt: now,
    publishedAt: now,
    updatedBy: 'Mahotsav Secretariat',
  };
}

export const CANONICAL_PUBLIC_PAGES: ReadonlyArray<PageInventoryRecord> = [
  makePage({
    id: 'pg-01',
    slug: 'home',
    route: '/',
    name: 'Homepage',
    category: 'core',
    title: 'Bhagavad Gita Vishwa Mahotsav 2027',
    titleHi: 'भगवद्गीता विश्व महोत्सव 2027',
    titleTe: 'భగవద్గీత విశ్వ మహోత్సవం 2027',
    subtitle: '18 Countries · 18 Chapters · 18 Languages — Hyderabad, India',
    summary:
      'Primary landing portal featuring Hero Showcase, Cultural Heritage Carousel, Why Participate, 18 Chapters preview, Participation Pathways, and Global Movement registration.',
    metaTitle: 'Bhagavad Gita Vishwa Mahotsav 2027 | Project ETERNAL',
    metaDescription:
      'Global cultural and philosophical gathering across 18 countries, 18 chapters, and 18 languages culminating 27 February 2027 in Hyderabad.',
    blocks: [
      {
        id: 'home-hero',
        type: 'hero',
        label: 'Primary Homepage Hero & Spiritual Showcase',
        order: 1,
        visible: true,
        eyebrow: { en: '18 Countries · 18 Chapters · 18 Languages' },
        heading: { en: 'Bhagavad Gita Vishwa Mahotsav 2027' },
        subheading: {
          en: 'One World. One Wisdom. One Universal Family — Curtain Raiser 20 December 2026 & Main Conclave 27 February 2027.',
        },
        ctaPrimaryLabel: { en: 'Join the Mahotsav' },
        ctaPrimaryHref: '/participate/register',
        ctaSecondaryLabel: { en: 'Explore the 18 Chapters' },
        ctaSecondaryHref: '/gita',
        carouselId: 'hero-main',
      },
      {
        id: 'home-spiritual-carousel',
        type: 'image-carousel',
        label: 'Right-Panel Spiritual Heritage Carousel',
        order: 2,
        visible: true,
        eyebrow: { en: 'Gita Mahotsav 2027' },
        heading: { en: 'The Eternal Wisdom.' },
        carouselId: 'hero-spiritual',
      },
      {
        id: 'home-why',
        type: 'text',
        label: 'Why Participate & Nine Pillars',
        order: 3,
        visible: true,
        eyebrow: { en: 'Nine Core Reasons' },
        heading: { en: 'Why the World Gathers Around the Gita' },
        body: {
          en: 'Over 18 months building toward February 2027, households, universities, and cultural institutions unite across 18 nations through synchronized Parayana, youth ethics forums, and classical discourse.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-02',
    slug: 'about',
    route: '/about',
    name: 'About',
    category: 'core',
    title: 'About Bhagavad Gita Vishwa Mahotsav 2027',
    subtitle: 'Origins, Stewardship & International Scope',
    summary:
      'Complete institutional overview of Project ETERNAL, organizers, cultural stewardship, and global milestones.',
    metaTitle: 'About Mahotsav 2027 | Project ETERNAL',
    metaDescription: 'Learn about Bhagavad Gita Vishwa Mahotsav 2027, Aishwarya Sarvahith Foundation, and Sree Media.',
    blocks: [
      {
        id: 'about-hero',
        type: 'hero',
        label: 'About Hero Introduction',
        order: 1,
        visible: true,
        eyebrow: { en: 'International Cultural Initiative' },
        heading: { en: 'About the Vishwa Mahotsav' },
        subheading: {
          en: 'An 18-country spiritual and philosophical confluence uniting scholars, youth, institutions, and families in Hyderabad.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-03',
    slug: 'vision-mission',
    route: '/about#vision',
    name: 'Vision & Mission',
    category: 'core',
    title: 'Vision, Mission & Three Foundational Anchors',
    subtitle: 'Dharma in Public Life, Education & Global Amity',
    summary: 'Foundational vision, mission statement, and long-term educational purpose of the Mahotsav.',
    metaTitle: 'Vision & Mission | Mahotsav 2027',
    metaDescription: 'Vision and mission pillars of Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'vision-text',
        type: 'text',
        label: 'Foundational Vision Statement',
        order: 1,
        visible: true,
        heading: { en: 'Clarity of Duty, Compassion & Global Harmony' },
        body: {
          en: 'To translate timeless Sanskrit dialogue into practical clarity for families, educators, community builders, and international delegates across 18 countries.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-04',
    slug: 'why-bhagavad-gita',
    route: '/#why-participate',
    name: 'Why Bhagavad Gita',
    category: 'core',
    title: 'Why the Bhagavad Gita Matters Today',
    subtitle: 'Nine Enduring Reasons to Join the Global Confluence',
    summary: 'Philosophical and societal relevance of the 700-verse dialogue for modern decision-making.',
    metaTitle: 'Why Bhagavad Gita | Mahotsav 2027',
    metaDescription: 'Explore nine timeless reasons why the Bhagavad Gita inspires modern civic and personal life.',
    blocks: [
      {
        id: 'why-gita-block',
        type: 'text',
        label: 'Why Gita Core Essay',
        order: 1,
        visible: true,
        heading: { en: 'Practical Equanimity Amid Complexity' },
        body: {
          en: 'From ethical resilience to selfless stewardship, each chapter equips seekers to act with steadiness, service, and mutual respect.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-05',
    slug: 'significance-of-18',
    route: '/about#eighteen',
    name: 'Significance of 18',
    category: 'scripture',
    title: 'The Sacred Symmetry of Eighteen',
    subtitle: '18 Chapters · 18 Countries · 18 Languages · 18 Months',
    summary: 'Architectural explanation of how the number 18 binds scripture, geography, language, and calendar.',
    metaTitle: 'Significance of 18 | Mahotsav 2027',
    metaDescription: 'Discover how the sacred symmetry of 18 unites Mahotsav 2027.',
    blocks: [
      {
        id: 'sig-18-block',
        type: 'text',
        label: 'Symmetry Overview',
        order: 1,
        visible: true,
        heading: { en: 'Eighteen Threads Across Time & Scripture' },
        body: {
          en: 'Eighteen Parvas of the Mahabharata, eighteen chapters of the Gita, and eighteen participating nations reflect one unbroken heritage of inquiry.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-06',
    slug: 'bhagavad-gita',
    route: '/gita',
    name: 'Bhagavad Gita',
    category: 'scripture',
    title: 'Bhagavad Gita — 3D Folio & Living Scripture',
    subtitle: '700 Sanskrit Verses Across 4 Eternal Yoga Streams',
    summary: 'Interactive 3D sacred volume, canonical shloka recitation, and Yoga of Action, Devotion, Knowledge, and Meditation.',
    metaTitle: 'Bhagavad Gita | Mahotsav 2027',
    metaDescription: 'Read canonical Bhagavad Gita verses, explore the 3D book, and study all four Yogas.',
    blocks: [
      {
        id: 'gita-hero',
        type: 'scripture',
        label: 'Scripture Sanctuary Hero',
        order: 1,
        visible: true,
        eyebrow: { en: 'Shrimad Bhagavad Gita' },
        heading: { en: '700 Shlokas in Living Voice & Translation' },
        scriptureRef: 'bg-2-47',
      },
    ],
  }),
  makePage({
    id: 'pg-07',
    slug: 'all-18-chapters',
    route: '/gita#chapter-dossier',
    name: 'All 18 Chapters',
    category: 'scripture',
    title: 'All 18 Chapters — Complete Philosophical Dossier',
    subtitle: 'Chapters I through XVIII with Shloka Counts & Insights',
    summary: 'Interactive explorer across all eighteen chapters of the Shrimad Bhagavad Gita.',
    metaTitle: 'All 18 Chapters | Bhagavad Gita Dossier',
    metaDescription: 'Browse Sanskrit titles, summaries, and essential teachings for every chapter of the Gita.',
    blocks: [
      {
        id: 'chapters-dossier',
        type: 'scripture',
        label: '18-Chapter Explorer Grid',
        order: 1,
        visible: true,
        heading: { en: 'Eighteen Chapters of the Song Celestial' },
      },
    ],
  }),
  makePage({
    id: 'pg-08',
    slug: 'global-journey',
    route: '/global-journey',
    name: 'Global Journey',
    category: 'programme',
    title: 'The 18-Country Global Pilgrimage & Parayana',
    subtitle: 'Connecting Continents Toward Hyderabad, February 2027',
    summary: 'International Parayana cities, online Curtain Raiser schedule, and diaspora participation hubs.',
    metaTitle: 'Global Journey | Mahotsav 2027',
    metaDescription: 'Track the international Bhagavad Gita Parayana journey across eighteen nations.',
    blocks: [
      {
        id: 'global-journey-hero',
        type: 'hero',
        label: 'Global Journey Header',
        order: 1,
        visible: true,
        heading: { en: 'Eighteen Countries United in Recitation' },
        subheading: {
          en: 'From Hyderabad and Kurukshetra to London, Tokyo, Nairobi, and Singapore.',
        },
      },
    ],
  }),
  makePage({
    id: 'pg-09',
    slug: 'countries',
    route: '/global-journey/18-countries',
    name: 'Countries',
    category: 'programme',
    title: 'Eighteen Participating Countries Directory',
    subtitle: 'Regional Hubs, Languages & Host Communities',
    summary: 'Verified roster of all eighteen countries participating in synchronized Mahotsav 2027 programming.',
    metaTitle: '18 Participating Countries | Mahotsav 2027',
    metaDescription: 'Directory of all 18 countries hosting synchronized Bhagavad Gita Parayana and dialogue.',
    blocks: [
      {
        id: 'countries-grid',
        type: 'event-card',
        label: '18 Countries Registry',
        order: 1,
        visible: true,
        heading: { en: 'National & Diaspora Study Chapters' },
      },
    ],
  }),
  makePage({
    id: 'pg-10',
    slug: 'programme',
    route: '/program',
    name: 'Programme',
    category: 'programme',
    title: 'Programme Architecture & 2026–2027 Timeline',
    subtitle: 'Curtain Raiser (20 Dec 2026) · Grand Conclave (27 Feb 2027)',
    summary: 'Comprehensive master programme spanning Parayana, Youth Conclave, Scholarly Colloquium, and Cultural Evening.',
    metaTitle: 'Programme | Mahotsav 2027',
    metaDescription: 'Official Mahotsav 2027 schedule, Curtain Raiser date, and Hyderabad programme tracks.',
    blocks: [
      {
        id: 'programme-timeline',
        type: 'timeline',
        label: 'Official Programme Timeline',
        order: 1,
        visible: true,
        heading: { en: 'Milestone Roadmap to 27 February 2027' },
      },
    ],
  }),
  makePage({
    id: 'pg-11',
    slug: 'events',
    route: '/program#events',
    name: 'Events',
    category: 'programme',
    title: 'Signature Mahotsav Events',
    subtitle: 'Six Flagship Assemblies & Interactive Sessions',
    summary: 'Official listing of Online Curtain Raiser, Main Conclave, Grand Parayana, Youth Gita Forum, Cultural Evenings, and Global Connect.',
    metaTitle: 'Signature Events | Mahotsav 2027',
    metaDescription: 'Detailed guide to all six flagship Bhagavad Gita Vishwa Mahotsav 2027 gatherings.',
    blocks: [
      {
        id: 'events-list',
        type: 'event-card',
        label: 'Flagship Event Cards',
        order: 1,
        visible: true,
        heading: { en: 'Flagship Assemblies & Gatherings' },
      },
    ],
  }),
  makePage({
    id: 'pg-12',
    slug: 'participation',
    route: '/participate',
    name: 'Participation',
    category: 'participation',
    title: 'Participate in the Mahotsav',
    subtitle: 'Six Delegate Pathways & Ten Ways to Join the Movement',
    summary: 'Explore Individual, Family, Group, Youth, Institutional, Scholarly, and Volunteer pathways.',
    metaTitle: 'Participate | Mahotsav 2027',
    metaDescription: 'Choose how you, your family, or your institution can participate in Mahotsav 2027.',
    blocks: [
      {
        id: 'participation-hub',
        type: 'participation-card',
        label: 'Participation Pathways Overview',
        order: 1,
        visible: true,
        heading: { en: 'Find Your Role in a Global Awakening' },
      },
    ],
  }),
  makePage({
    id: 'pg-13',
    slug: 'youth',
    route: '/participate#youth',
    name: 'Youth',
    category: 'participation',
    title: 'Youth & University Gita Fellowship (Ages 15–35)',
    subtitle: 'Student Ambassadors, Ethical Leadership & Debates',
    summary: 'Dedicated programming for college societies, young professionals, and creative media fellows.',
    metaTitle: 'Youth Participation | Mahotsav 2027',
    metaDescription: 'Register as a Youth Fellow or university ambassador for Mahotsav 2027.',
    blocks: [
      {
        id: 'youth-cta',
        type: 'cta',
        label: 'Youth Fellowship Call to Action',
        order: 1,
        visible: true,
        heading: { en: 'Join the International Youth Gita Forum' },
        ctaPrimaryLabel: { en: 'Apply for Youth Track' },
        ctaPrimaryHref: '/participate/register?type=youth',
      },
    ],
  }),
  makePage({
    id: 'pg-14',
    slug: 'group-registration',
    route: '/participate/register?type=group',
    name: 'Group Registration',
    category: 'participation',
    title: 'Group & Family Delegation Registration',
    subtitle: 'Coordinate Satsangs, Study Circles & Community Mandals',
    summary: 'Multi-delegate registration portal with group coordinator fields and Parayana seating allocation.',
    metaTitle: 'Group Registration | Mahotsav 2027',
    metaDescription: 'Register a family or community study group for Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'group-cta',
        type: 'participation-card',
        label: 'Group Coordinator Guide',
        order: 1,
        visible: true,
        heading: { en: 'Delegation & Family Enrollment' },
      },
    ],
  }),
  makePage({
    id: 'pg-15',
    slug: 'institutional-participation',
    route: '/participate/register?type=institution',
    name: 'Institutional Participation',
    category: 'participation',
    title: 'Institutional, University & Ashram Delegations',
    subtitle: 'Official Academic, Cultural & NGO Partnerships',
    summary: 'Registration workflow for universities, cultural academies, temples, and international endowments.',
    metaTitle: 'Institutional Participation | Mahotsav 2027',
    metaDescription: 'Enroll an institution, university, or cultural foundation in Mahotsav 2027.',
    blocks: [
      {
        id: 'inst-cta',
        type: 'participation-card',
        label: 'Institutional Charter Card',
        order: 1,
        visible: true,
        heading: { en: 'Institutional Delegate Protocol' },
      },
    ],
  }),
  makePage({
    id: 'pg-16',
    slug: 'volunteer',
    route: '/participate#volunteer-seva',
    name: 'Volunteer',
    category: 'participation',
    title: 'Seva & Volunteer Brigade',
    subtitle: 'Hospitality, Translation, Media, Logistics & Stage',
    summary: 'Five specialized volunteer seva departments welcoming trained coordinators across languages.',
    metaTitle: 'Volunteer Seva | Mahotsav 2027',
    metaDescription: 'Offer Seva in hospitality, translation, media, logistics, or stage operations.',
    blocks: [
      {
        id: 'volunteer-seva-block',
        type: 'participation-card',
        label: 'Five Seva Departments',
        order: 1,
        visible: true,
        heading: { en: 'Serve With Calm Dedication (Nishkama Seva)' },
      },
    ],
  }),
  makePage({
    id: 'pg-17',
    slug: 'registration',
    route: '/participate/register',
    name: 'Registration',
    category: 'participation',
    title: 'Official Delegate Registration Portal',
    subtitle: 'Guided Enrollment, Assistance Needs & Voluntary Contribution',
    summary: 'Voice-assisted and multilingual 8-step registration with reference code generation and payment portal status lookup.',
    metaTitle: 'Register | Mahotsav 2027',
    metaDescription: 'Complete official delegate registration for Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'reg-portal-hero',
        type: 'cta',
        label: 'Delegate Enrollment Header',
        order: 1,
        visible: true,
        heading: { en: 'Confirm Your Presence in Hyderabad' },
        ctaPrimaryLabel: { en: 'Begin Delegate Registration' },
        ctaPrimaryHref: '/participate/register',
      },
    ],
  }),
  makePage({
    id: 'pg-18',
    slug: 'leadership',
    route: '/leadership',
    name: 'Leadership',
    category: 'governance',
    title: 'Organising Committee & Cultural Stewardship',
    subtitle: 'Verified Executive Conveners & Advisory Leadership',
    summary: 'Transparent governance profiles strictly reflecting Secretariat-approved organising committee members.',
    metaTitle: 'Leadership | Mahotsav 2027',
    metaDescription: 'Meet the verified organising leadership behind Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'leadership-grid',
        type: 'leadership',
        label: 'Organising Committee Profiles',
        order: 1,
        visible: true,
        heading: { en: 'Secretariat & Organising Stewardship' },
      },
    ],
  }),
  makePage({
    id: 'pg-19',
    slug: 'partners',
    route: '/partners',
    name: 'Partners',
    category: 'governance',
    title: 'Founding Partners & Supporting Institutions',
    subtitle: 'Aishwarya Sarvahith Foundation · Sree Media · Accredited Hosts',
    summary: 'Verified founding partners and institutional collaboration directory.',
    metaTitle: 'Partners | Mahotsav 2027',
    metaDescription: 'Founding and collaborating institutions of Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'partners-list',
        type: 'partners',
        label: 'Partner Roster & Collaboration Inquiry',
        order: 1,
        visible: true,
        heading: { en: 'Founding & Cultural Partners' },
      },
    ],
  }),
  makePage({
    id: 'pg-20',
    slug: 'gallery',
    route: '/media',
    name: 'Gallery',
    category: 'media',
    title: 'Sacred Cultural Artwork & Pavilion Gallery',
    subtitle: 'Curated Plates & Secretariat Uploads',
    summary: 'High-resolution visual archive of Mahabharata artworks, temple sanctums, Devi heritage, and palm-leaf manuscripts.',
    metaTitle: 'Gallery | Mahotsav 2027 Media Archive',
    metaDescription: 'Browse curated cultural plates and high-resolution artworks for Mahotsav 2027.',
    blocks: [
      {
        id: 'media-gallery-block',
        type: 'gallery',
        label: 'Cultural Plates Archive',
        order: 1,
        visible: true,
        heading: { en: 'Curated Cultural Gallery' },
      },
    ],
  }),
  makePage({
    id: 'pg-21',
    slug: 'videos',
    route: '/media#videos',
    name: 'Videos',
    category: 'media',
    title: 'Documentaries, Promos & Recitation Films',
    subtitle: 'Official Teasers & Multilingual Briefings',
    summary: 'Published promo reels, Curtain Raiser broadcasts, and 3D Gita previews.',
    metaTitle: 'Videos & Films | Mahotsav 2027',
    metaDescription: 'Watch official Bhagavad Gita Vishwa Mahotsav 2027 videos and teasers.',
    blocks: [
      {
        id: 'media-videos-block',
        type: 'video',
        label: 'Video Reels Archive',
        order: 1,
        visible: true,
        heading: { en: 'Official Films & Promo Reels' },
      },
    ],
  }),
  makePage({
    id: 'pg-22',
    slug: 'announcements',
    route: '/media#announcements',
    name: 'Announcements',
    category: 'media',
    title: 'Official Press Releases & Secretariat Notices',
    subtitle: 'Dated Bulletins & Programme Circulars',
    summary: 'Verified announcements, accreditation circulars, and key registration windows.',
    metaTitle: 'Announcements | Mahotsav 2027',
    metaDescription: 'Read verified press bulletins and Secretariat notices for Mahotsav 2027.',
    blocks: [
      {
        id: 'media-announcements-block',
        type: 'text',
        label: 'Press Notices Ledger',
        order: 1,
        visible: true,
        heading: { en: 'Official Secretariat Bulletins' },
      },
    ],
  }),
  makePage({
    id: 'pg-23',
    slug: 'contact',
    route: '/contact',
    name: 'Contact',
    category: 'support',
    title: 'Contact the Mahotsav Secretariat',
    subtitle: 'Delegate Desk, Media Accreditation & Institutional Queries',
    summary: 'Direct official contact channels in Hyderabad for international delegates and institutional partners.',
    metaTitle: 'Contact Us | Mahotsav 2027',
    metaDescription: 'Reach the Bhagavad Gita Vishwa Mahotsav 2027 Secretariat in Hyderabad.',
    blocks: [
      {
        id: 'contact-desk',
        type: 'text',
        label: 'Secretariat Channels',
        order: 1,
        visible: true,
        heading: { en: 'Hyderabad Secretariat & Global Desk' },
      },
    ],
  }),
  makePage({
    id: 'pg-24',
    slug: 'faqs',
    route: '/faqs',
    name: 'FAQs',
    category: 'support',
    title: 'Frequently Asked Questions',
    subtitle: 'Dates, Registration, Visa Support & Dress Protocol',
    summary: 'Verified answers to the most common participant and volunteer questions.',
    metaTitle: 'FAQs | Mahotsav 2027',
    metaDescription: 'Answers regarding registration, dates, travel assistance, and languages for Mahotsav 2027.',
    blocks: [
      {
        id: 'faq-accordion',
        type: 'faq',
        label: 'Official Q&A Accordion',
        order: 1,
        visible: true,
        heading: { en: 'Participant & Volunteer FAQs' },
      },
    ],
  }),
  makePage({
    id: 'pg-25',
    slug: 'privacy-policy',
    route: '/privacy-policy',
    name: 'Privacy Policy',
    category: 'legal',
    title: 'Privacy & Data Stewardship Policy',
    subtitle: 'Participant Data Protection Charter',
    summary: 'Full policy governing registration records, communication consent, and data retention.',
    metaTitle: 'Privacy Policy | Mahotsav 2027',
    metaDescription: 'Read the Privacy & Data Stewardship Policy of Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'privacy-doc',
        type: 'text',
        label: 'Privacy Legal Document',
        order: 1,
        visible: true,
        heading: { en: 'Participant Data Protection Standards' },
      },
    ],
  }),
  makePage({
    id: 'pg-26',
    slug: 'terms-conditions',
    route: '/terms-conditions',
    name: 'Terms & Conditions',
    category: 'legal',
    title: 'Terms & Conditions of Attendance',
    subtitle: 'Accreditation, Photography & Event Guidelines',
    summary: 'Legal terms governing delegate passes, venue conduct, and programme adjustments.',
    metaTitle: 'Terms & Conditions | Mahotsav 2027',
    metaDescription: 'Review official terms and conditions for Bhagavad Gita Vishwa Mahotsav 2027.',
    blocks: [
      {
        id: 'terms-doc',
        type: 'text',
        label: 'Terms Legal Document',
        order: 1,
        visible: true,
        heading: { en: 'Attendance & Code of Conduct' },
      },
    ],
  }),
  makePage({
    id: 'pg-27',
    slug: 'cancellation-refund-policy',
    route: '/cancellation-refund-policy',
    name: 'Cancellation & Refund Policy',
    category: 'legal',
    title: 'Cancellation, Substitution & Contribution Policy',
    subtitle: 'Voluntary Offerings & Delegate Transfers',
    summary: 'Official Secretariat terms covering pass transfers, duplicate transaction refunds, and Seva offerings.',
    metaTitle: 'Cancellation & Refund Policy | Mahotsav 2027',
    metaDescription: 'Policy on delegate pass transfers and refund requests for Mahotsav 2027.',
    blocks: [
      {
        id: 'refund-doc',
        type: 'text',
        label: 'Cancellation & Refund Document',
        order: 1,
        visible: true,
        heading: { en: 'Delegate Substitutions & Duplicate Contribution Refunds' },
      },
    ],
  }),
  makePage({
    id: 'pg-28',
    slug: 'story',
    route: '/story',
    name: '3D Mahabharata & Gita Story Experience',
    category: 'scripture',
    title: 'Interactive 3D Kurukshetra & Mahabharata Story',
    subtitle: '15 Cinematic Chapters · 8 Character GLB Rigs · Neural Narration',
    summary: 'Real-time 3D interactive journey through Kurukshetra, Gita Upadesha, Vishvarupa, and the 18-day war.',
    metaTitle: '3D Gita Story Experience | Project ETERNAL',
    metaDescription: 'Experience the interactive 3D Mahabharata and Bhagavad Gita story mode in EN, HI, and TE.',
    blocks: [
      {
        id: 'story-stage-block',
        type: 'scripture',
        label: '3D Story Stage & Scene Metadata',
        order: 1,
        visible: true,
        heading: { en: 'Kurukshetra — Fifteen Interactive Chapters' },
      },
    ],
  }),
];

export const CANONICAL_CAROUSELS: ReadonlyArray<CarouselConfigRecord> = ([
  {
    id: 'hero-main',
    name: 'Homepage Full-Screen Background Carousel',
    placement: 'HomePage Hero Background (8 Slides)',
    autoAdvanceMs: 6500,
    transitionStyle: 'slide-rtl',
    status: 'published',
    hasUnpublishedDraft: false,
    updatedAt: '2026-06-01T00:00:00.000Z',
    publishedSlides: [
      {
        id: 'eternal-pavilion',
        assetKey: 'heroPavilion',
        src: '',
        mobileSrc: '',
        title: 'Bhagavad Gita Vishwa Mahotsav · Hyderabad',
        subtitle: 'Architectural Pavilion & Global Gathering Venue',
        alt: 'Illuminated sandstone and gold pavilion rising at dusk above reflective courtyard waters',
        objectPosition: 'object-bottom md:object-[66%_center] lg:object-center',
        order: 1,
        enabled: true,
      },
      {
        id: 'kurukshetra-dialogue',
        assetKey: 'heroKurukshetraDialogue',
        src: '',
        title: 'Kurukshetra Sacred Dialogue',
        subtitle: 'Lord Krishna & Arjuna · Eternal Dharma on the Chariot',
        alt: 'Classical oil painting of Lord Krishna imparting the wisdom of the Bhagavad Gita to Arjuna beside their chariot at dawn',
        objectPosition: 'object-center',
        order: 2,
        enabled: true,
      },
      {
        id: 'vishvarupa-vision',
        assetKey: 'heroVishvarupaVision',
        src: '',
        title: 'Vishvarupa · Cosmic Unity',
        subtitle: 'Chapter XI · One Harmony Across Cosmos & Humanity',
        alt: 'Monumental sacred Indian painting of the cosmic Vishvarupa form encircled by golden astronomical mandalas',
        objectPosition: 'object-center',
        order: 3,
        enabled: true,
      },
      {
        id: 'ancient-temple-sanctum',
        assetKey: 'heroAncientTempleSanctum',
        src: '',
        title: 'Timeless Sanctum Heritage',
        subtitle: 'Carved Stone Mandapas · Living Continuity of Sanatana Wisdom',
        alt: 'Sunbeams illuminating carved ancient Indian sandstone temple pillars and brass oil lamps',
        objectPosition: 'object-center',
        order: 4,
        enabled: true,
      },
      {
        id: 'sacred-gita-volume',
        assetKey: 'eternalGitaVolume',
        src: '',
        title: '700 Shlokas · 18 Chapters · 18 Languages',
        subtitle: 'Preserved Manuscript & Multilingual Global Study',
        alt: 'Illuminated sacred edition of the Bhagavad Gita resting upon a sculpted pedestal in quiet light',
        objectPosition: 'object-center',
        order: 5,
        enabled: true,
      },
      {
        id: 'twilight-sanctum',
        assetKey: 'eveningSanctum',
        src: '',
        title: 'Global Peace & Collective Parayana',
        subtitle: '20 Dec 2026 Online Curtain Raiser · 27 Feb 2027 Grand Conclave',
        alt: 'Twilight reflection basin before an illuminated sandstone sanctuary',
        objectPosition: 'object-center',
        order: 6,
        enabled: true,
      },
      {
        id: 'youth-gita-forum',
        assetKey: 'heroYouthGitaForum',
        src: '',
        title: 'Youth & University Gita Dialogue (15–35)',
        subtitle: 'Campus Leadership, Ethics & Conscious Action Forums',
        alt: 'International students and youth delegates gathered around Bhagavad Gita dialogue tables inside a sunlit stone hall',
        objectPosition: 'object-center',
        order: 7,
        enabled: true,
      },
      {
        id: 'global-parayana-sanctum',
        assetKey: 'heroGlobalParayanaSanctum',
        src: '',
        title: '18-Nation Synchronized Parayana',
        subtitle: 'Eighteen Chapters Chanted Across Eighteen Countries',
        alt: 'Sacred evening parayana assembly with brass lamps illuminated beneath carved sandstone arches',
        objectPosition: 'object-center',
        order: 8,
        enabled: true,
      },
    ],
  },
  {
    id: 'hero-spiritual',
    name: 'Hero Right-Panel Spiritual Showcase Carousel',
    placement: 'Hero Right Split Architectural Frame (8 Slides)',
    autoAdvanceMs: 5200,
    transitionStyle: 'slide-rtl',
    status: 'published',
    hasUnpublishedDraft: false,
    updatedAt: '2026-06-01T00:00:00.000Z',
    publishedSlides: [
      {
        id: 'lord-krishna-portrait',
        assetKey: 'lordKrishnaPortrait',
        src: '',
        title: 'The Eternal Wisdom.',
        caption: 'The Eternal Wisdom.',
        subtitle: 'Sri Krishna · Peacock Crown & Sacred Flute',
        chapterRef: 'Gita Mahotsav 2027',
        alt: 'Classical Indian devotional painting of Lord Krishna holding a golden flute inside a carved sandstone mandapa',
        objectPosition: '50% 22%',
        order: 1,
        enabled: true,
      },
      {
        id: 'krishna-arjuna-chariot',
        assetKey: 'heroKurukshetraDialogue',
        src: '',
        title: 'The Divine Dialogue.',
        caption: 'The Divine Dialogue.',
        subtitle: 'Lord Krishna & Arjuna Upon the Chariot',
        chapterRef: 'Chapter II · Sankhya Yoga',
        alt: 'Classical painting of Lord Krishna and Arjuna standing beside their golden chariot at dawn',
        objectPosition: '50% 35%',
        order: 2,
        enabled: true,
      },
      {
        id: 'open-bhagavad-gita',
        assetKey: 'openBhagavadGitaBook',
        src: '',
        title: 'The Sacred Scripture.',
        caption: 'The Sacred Scripture.',
        subtitle: 'Illuminated Sanskrit Verses & Temple Diya',
        chapterRef: '700 Timeless Shlokas',
        alt: 'Open antique Bhagavad Gita volume resting on a carved wooden bookstand lit by a brass lamp',
        objectPosition: '50% 48%',
        order: 3,
        enabled: true,
      },
      {
        id: 'ancient-sanskrit-scripture',
        assetKey: 'manuscriptCraft',
        src: '',
        title: 'Preserved Manuscript Craft',
        caption: 'The Sacred Scripture.',
        subtitle: 'Preserved Palm-Leaf & Sanskrit Folio Tradition',
        chapterRef: '18 Languages · Global Archive',
        alt: 'Close study of preserved ancient Sanskrit palm-leaf manuscripts crafted in traditional gold ink',
        objectPosition: '50% 50%',
        order: 4,
        enabled: true,
      },
      {
        id: 'golden-embossed-gita',
        assetKey: 'eternalGitaVolume',
        src: '',
        title: 'Eternal Royal Edition',
        caption: 'The Wisdom of the Gita.',
        subtitle: 'Gold-Embossed Commemorative Bhagavad Gita',
        chapterRef: 'Eternal Royal Edition',
        alt: 'Gold-embossed sacred edition of the Bhagavad Gita resting upon an illuminated pedestal',
        objectPosition: '50% 45%',
        order: 5,
        enabled: true,
      },
      {
        id: 'vishvarupa-artwork',
        assetKey: 'heroVishvarupaVision',
        src: '',
        title: 'The Universal Vision.',
        caption: 'The Universal Vision.',
        subtitle: 'Vishvarupa · Cosmic Harmony & Oneness',
        chapterRef: 'Chapter XI · Vishvarupa Darshana',
        alt: 'Sacred classical painting of the cosmic Vishvarupa form surrounded by golden mandalas',
        objectPosition: '50% 32%',
        order: 6,
        enabled: true,
      },
      {
        id: 'kurukshetra-battlefield',
        assetKey: 'kurukshetraSacredBattlefield',
        src: '',
        title: 'Kurukshetra Dawn',
        caption: 'The Divine Dialogue.',
        subtitle: 'Kurukshetra · Sacred Dawn of Awakening',
        chapterRef: 'Chapter I · Kurukshetra Kshetra',
        alt: 'Golden sunrise breaking across the sacred plain of Kurukshetra with ancient Vedic banners and chariots',
        objectPosition: '50% 52%',
        order: 7,
        enabled: true,
      },
      {
        id: 'krishna-teaching-arjuna',
        assetKey: 'krishnaTeachingArjuna',
        src: '',
        title: 'Krishna Teaching Arjuna',
        caption: 'The Eternal Wisdom.',
        subtitle: 'Krishna Imparting Dharma to Arjuna',
        chapterRef: 'Chapter XVIII · Moksha Sannyasa',
        alt: 'Classical Indian artwork of Lord Krishna in chinmudra calmly teaching Arjuna beside their chariot',
        objectPosition: '50% 32%',
        order: 8,
        enabled: true,
      },
    ],
  },
] satisfies Omit<CarouselConfigRecord, 'draftSlides'>[]).map((c) => ({
  ...c,
  draftSlides: JSON.parse(JSON.stringify(c.publishedSlides)) as CarouselSlideConfig[],
}));

// Keep draft versions initialized cleanly matching published defaults
CANONICAL_CAROUSELS.forEach((c) => {
  if (c.draftSlides.length === 0) {
    c.draftSlides = JSON.parse(JSON.stringify(c.publishedSlides)) as CarouselSlideConfig[];
  }
});

/**
 * Pure CMS Resolvers (Zero JSX/image imports so server and unit tests share exact semantics)
 */

export function filterPublishedPages(
  pages: ReadonlyArray<PageInventoryRecord> | undefined,
): PageInventoryRecord[] {
  if (!Array.isArray(pages)) return [];
  return pages.filter((p) => p.status === 'published');
}

export function resolvePageForRoute(
  pages: ReadonlyArray<PageInventoryRecord> | undefined,
  routeOrSlug: string,
  options: { includeDrafts?: boolean } = {},
): PageInventoryRecord | null {
  if (!Array.isArray(pages)) return null;
  const clean = routeOrSlug.trim().toLowerCase();
  const found =
    pages.find(
      (p) =>
        p.route.toLowerCase() === clean ||
        p.slug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean,
    ) ?? null;

  if (!found) return null;
  if (!options.includeDrafts && found.status !== 'published') return null;
  return found;
}

export function resolvePageSnapshot(
  page: PageInventoryRecord | null | undefined,
  useDraft = false,
): PageSnapshotPayload | null {
  if (!page) return null;
  if (useDraft) return page.draftVersion;
  if (page.status !== 'published') return null;
  return page.publishedVersion;
}

export function resolveLocalizedText(
  map: LocalizedTextMap | undefined,
  locale: AdminLocaleCode,
  fallback: string,
): string {
  if (!map) return fallback;
  const candidate =
    (locale === 'hi' ? map.hi : locale === 'te' ? map.te : map.en) ?? map.en;
  return candidate && candidate.trim().length > 0 ? candidate : fallback;
}

export function resolvePublishedHeroSlides<T extends { id: string; src: string; title: string; subtitle: string; alt: string; objectPosition?: string }>(
  baseSlides: ReadonlyArray<T>,
  carousels: ReadonlyArray<CarouselConfigRecord> | undefined,
  resolveAssetSrc: (assetKey?: string, directSrc?: string) => string,
  useDraft = false,
): T[] {
  const cfg = carousels?.find((c) => c.id === 'hero-main');
  if (!cfg) return [...baseSlides];
  if (!useDraft && cfg.status !== 'published') return [...baseSlides];

  const sourceSlides = useDraft ? cfg.draftSlides : cfg.publishedSlides;
  const active = [...sourceSlides]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  if (active.length === 0) return [...baseSlides];

  return active.map((slide) => {
    const matchedBase = baseSlides.find((b) => b.id === slide.id);
    const resolvedSrc = resolveAssetSrc(slide.assetKey, slide.src) || matchedBase?.src || '';
    return {
      ...(matchedBase ?? {}),
      id: slide.id,
      src: resolvedSrc,
      title: slide.title,
      subtitle: slide.subtitle,
      alt: slide.alt,
      objectPosition: slide.objectPosition ?? matchedBase?.objectPosition ?? 'object-center',
    } as T;
  });
}

export function resolvePublishedSpiritualSlides<T extends { id: string; src: string; caption: string; subtitle: string; chapterRef: string; alt: string; objectPosition?: string }>(
  baseSlides: ReadonlyArray<T>,
  carousels: ReadonlyArray<CarouselConfigRecord> | undefined,
  resolveAssetSrc: (assetKey?: string, directSrc?: string) => string,
  useDraft = false,
): { slides: T[]; autoAdvanceMs: number } {
  const cfg = carousels?.find((c) => c.id === 'hero-spiritual');
  if (!cfg || (!useDraft && cfg.status !== 'published')) {
    return { slides: [...baseSlides], autoAdvanceMs: cfg?.autoAdvanceMs ?? 5200 };
  }

  const sourceSlides = useDraft ? cfg.draftSlides : cfg.publishedSlides;
  const active = [...sourceSlides]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  if (active.length === 0) {
    return { slides: [...baseSlides], autoAdvanceMs: cfg.autoAdvanceMs || 5200 };
  }

  return {
    autoAdvanceMs: cfg.autoAdvanceMs || 5200,
    slides: active.map((slide) => {
      const matchedBase = baseSlides.find((b) => b.id === slide.id);
      const resolvedSrc = resolveAssetSrc(slide.assetKey, slide.src) || matchedBase?.src || '';
      return {
        ...(matchedBase ?? {}),
        id: slide.id,
        src: resolvedSrc,
        caption: slide.caption || slide.title || matchedBase?.caption || '',
        subtitle: slide.subtitle,
        chapterRef: slide.chapterRef || matchedBase?.chapterRef || 'Gita Mahotsav 2027',
        alt: slide.alt,
        objectPosition: slide.objectPosition ?? matchedBase?.objectPosition ?? '50% 35%',
      } as T;
    }),
  };
}

export function computeMediaUsageLocations(
  asset: Pick<MediaAssetRecord, 'id' | 'assetKey' | 'url'>,
  pages: ReadonlyArray<PageInventoryRecord>,
  carousels: ReadonlyArray<CarouselConfigRecord>,
): string[] {
  const locations = new Set<string>();
  const url = asset.url?.trim();
  const key = asset.assetKey?.trim();

  for (const carousel of carousels) {
    for (const slide of carousel.publishedSlides) {
      if (
        slide.mediaAssetId === asset.id ||
        (key && slide.assetKey === key) ||
        (url && slide.src === url)
      ) {
        locations.add(`Carousel: ${carousel.name}`);
      }
    }
  }

  for (const page of pages) {
    for (const block of page.publishedVersion.blocks) {
      if (
        block.mediaAssetId === asset.id ||
        (url && block.mediaUrl === url)
      ) {
        locations.add(`Page: ${page.name} (${page.route})`);
      }
    }
  }

  if (key && key.startsWith('story:')) {
    locations.add(`3D Story Artwork Plate`);
  }

  return Array.from(locations);
}

export function replaceMediaReferences(params: {
  assetId: string;
  assetKey?: string;
  oldUrl?: string;
  newUrl: string;
  newAltText?: string;
  pages: PageInventoryRecord[];
  carousels: CarouselConfigRecord[];
}): { updatedPagesCount: number; updatedSlidesCount: number } {
  let updatedPagesCount = 0;
  let updatedSlidesCount = 0;

  for (const page of params.pages) {
    let pageChanged = false;
    for (const block of [...page.publishedVersion.blocks, ...page.draftVersion.blocks]) {
      if (
        block.mediaAssetId === params.assetId ||
        (params.oldUrl && block.mediaUrl === params.oldUrl)
      ) {
        block.mediaUrl = params.newUrl;
        if (params.newAltText) block.mediaAlt = params.newAltText;
        pageChanged = true;
      }
    }
    if (pageChanged) updatedPagesCount += 1;
  }

  for (const carousel of params.carousels) {
    for (const slide of [...carousel.publishedSlides, ...carousel.draftSlides]) {
      if (
        slide.mediaAssetId === params.assetId ||
        (params.assetKey && slide.assetKey === params.assetKey) ||
        (params.oldUrl && slide.src === params.oldUrl)
      ) {
        slide.src = params.newUrl;
        if (params.newAltText) slide.alt = params.newAltText;
        updatedSlidesCount += 1;
      }
    }
  }

  return { updatedPagesCount, updatedSlidesCount };
}

export function filterRecordsByDateRange<T extends { createdAt?: string; updatedAt?: string }>(
  records: ReadonlyArray<T>,
  range: 'all' | '7d' | '30d',
  nowMs = Date.now(),
): T[] {
  if (range === 'all') return [...records];
  const windowMs = (range === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
  const cutoff = nowMs - windowMs;
  return records.filter((r) => {
    const raw = r.createdAt ?? r.updatedAt;
    if (!raw) return true;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t >= cutoff : true;
  });
}

export function paginateRecords<T>(
  items: ReadonlyArray<T>,
  page: number,
  pageSize: number,
): {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
} {
  const safeSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    totalPages,
    totalItems,
  };
}

export function buildAdminNotifications(input: {
  pendingParticipants: number;
  flaggedParticipants: number;
  pendingVolunteers: number;
  unpublishedDraftPages: number;
  unpublishedDraftCarousels: number;
  gatewayConfigured: boolean;
}): AdminNotificationItem[] {
  const items: AdminNotificationItem[] = [];
  const now = new Date().toISOString();

  if (input.flaggedParticipants > 0) {
    items.push({
      id: 'notif-flagged',
      severity: 'action-required',
      title: `${input.flaggedParticipants} Flagged Registration${input.flaggedParticipants > 1 ? 's' : ''}`,
      detail: 'Secretariat manual review requested in the Participants desk.',
      targetModule: 'participants',
      timestamp: now,
    });
  }

  if (input.pendingParticipants > 0) {
    items.push({
      id: 'notif-pending-reg',
      severity: 'warning',
      title: `${input.pendingParticipants} Pending Delegate Verification${input.pendingParticipants > 1 ? 's' : ''}`,
      detail: 'Verify incoming registrations and assign assistance coordination.',
      targetModule: 'registrations',
      timestamp: now,
    });
  }

  if (input.pendingVolunteers > 0) {
    items.push({
      id: 'notif-volunteers',
      severity: 'warning',
      title: `${input.pendingVolunteers} Volunteer Seva Application${input.pendingVolunteers > 1 ? 's' : ''} Pending`,
      detail: 'Approve departments and badge IDs in Volunteer Seva.',
      targetModule: 'volunteers',
      timestamp: now,
    });
  }

  if (input.unpublishedDraftPages > 0 || input.unpublishedDraftCarousels > 0) {
    items.push({
      id: 'notif-drafts',
      severity: 'info',
      title: 'Unpublished CMS Drafts Waiting',
      detail: `${input.unpublishedDraftPages} page draft(s) and ${input.unpublishedDraftCarousels} carousel draft(s) are staged before public release.`,
      targetModule: 'pageBuilder',
      timestamp: now,
    });
  }

  if (!input.gatewayConfigured) {
    items.push({
      id: 'notif-gateway',
      severity: 'info',
      title: 'External Payment Portal Handoff Mode',
      detail: 'Configure webhook HMAC keys in environment to activate automated receipt capture.',
      targetModule: 'payments',
      timestamp: now,
    });
  }

  return items;
}
