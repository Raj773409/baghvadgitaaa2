import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashPassword, type AdminRole } from './rbac.ts';
import {
  CANONICAL_CAROUSELS,
  CANONICAL_PUBLIC_PAGES,
  computeMediaUsageLocations,
  type CarouselConfigRecord,
  type ContentRevisionRecord,
  type MediaAssetRecord,
  type PageInventoryRecord,
  type ScriptureChapterOverride,
  type ScriptureVerseRecord as CmsScriptureVerseRecord,
  type StorySceneOverride,
  type StructuredCollectionItem,
} from '../src/utils/cmsSync.ts';
import { CANONICAL_GITA_VERSES, GITA_CHAPTER_CATALOG } from '../src/content/scriptureContent.ts';
import { STORY_SCENES } from '../src/content/storyContent.ts';
import { STORY_ASSET_LIST } from '../src/content/storyAssets.ts';
import {
  OFFICIAL_ANNOUNCEMENTS,
  OFFICIAL_EVENTS_PROGRAM,
  OFFICIAL_SCHEDULE_LEDGER,
  VERIFIED_ORGANISING_COMMITTEE,
  VERIFIED_ORGANIZING_PARTNERS,
} from '../src/content/eventContent.ts';
import { MOVEMENT_TEN_PATHWAYS } from '../src/content/participationContent.ts';
import { OFFICIAL_FAQS } from '../src/content/faqAndPolicyContent.ts';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  mustChangePassword: boolean;
  passwordUpdatedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ParticipantRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  noOfPersons: number;
  donationAmountInr: number;
  registrationType: string;
  country: string;
  city: string;
  assistance: { visa: boolean; accommodation: boolean; localTransport: boolean };
  events: { curtainRaiser: boolean; mahotsav: boolean };
  preferredLanguage?: string;
  familyOrGroupMembers?: string;
  organisationName?: string;
  organisationRole?: string;
  volunteerSkills?: string;
  parayanaCity?: string;
  assistanceNotes?: string;
  verificationStatus: 'pending' | 'verified' | 'flagged';
  paymentStatus: 'awaiting-gateway' | 'paid' | 'refunded';
  referenceCode: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  participantId: string;
  participantName: string;
  amountInr: number;
  currency: 'INR';
  /** 'sandbox' = built-in test gateway used when no live gateway keys are configured. */
  gateway: 'external-handoff' | 'razorpay' | 'stripe' | 'sandbox';
  gatewayReference: string;
  gatewayOrderId: string | null;
  status: 'initiated' | 'captured' | 'refunded' | 'failed';
  createdAt: string;
  /** 'live' = real money (Razorpay live keys), 'test' = Razorpay test keys or sandbox. */
  mode?: 'live' | 'test';
  methodFamily?: 'upi' | 'card' | 'netbanking' | 'wallet' | null;
  methodProvider?: string | null;
  /** Masked display label only (e.g. "Visa •••• 4242"); never a full card number. */
  methodLabel?: string | null;
  receiptNumber?: string | null;
  capturedAt?: string | null;
  failureReason?: string | null;
  attempts?: number;
}

/** Entry pass ("token") issued per selected event once a payment is captured. */
export interface EntryPassRecord {
  id: string;
  participantId: string;
  paymentId: string;
  passCode: string;
  eventKey: 'curtainRaiser' | 'mahotsav';
  eventName: string;
  eventDate: string;
  venue: string;
  admits: number;
  tier: string;
  /** Signed payload encoded into the QR so gate staff can verify offline-issued passes. */
  qrPayload: string;
  status: 'active' | 'checked-in' | 'revoked';
  issuedAt: string;
  checkedInAt: string | null;
}

export interface ParticipantNotificationRecord {
  id: string;
  participantId: string;
  kind: 'registration' | 'payment' | 'pass' | 'profile' | 'system';
  tone: 'success' | 'info' | 'warning' | 'error';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface WebhookEventRecord {
  bodyHash: string;
  gateway: 'razorpay' | 'stripe' | 'custom';
  receivedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  amountInr: number;
  reason: string;
  approvedBy: string;
  status: 'processed' | 'pending';
  createdAt: string;
}

export interface VolunteerRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  department: 'hospitality' | 'translation' | 'media' | 'logistics' | 'stage';
  volunteerBadgeId: string;
  approvalStatus: 'pending' | 'approved' | 'declined';
  attendanceCount: number;
  createdAt: string;
}

export interface MembershipRecord {
  id: string;
  memberName: string;
  email: string;
  tier: 'patron' | 'lifetime' | 'institutional' | 'youth-fellow';
  country: string;
  status: 'active' | 'pending';
  createdAt: string;
}

export interface ManagedMediaRecord {
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

export interface CmsManagedItem {
  id: string;
  section:
    | 'hero'
    | 'krishnaFeature'
    | 'participationCategories'
    | 'donationConfig'
    | 'voiceScripts'
    | 'translations'
    | 'events'
    | 'schedule'
    | 'chapters'
    | 'scripture'
    | 'voice'
    | 'story'
    | 'leadership'
    | 'partners'
    | 'news'
    | 'faqs'
    | 'pages';
  title: string;
  subtitle: string;
  body: string;
  language: 'en' | 'hi' | 'te' | 'sa';
  status: 'published' | 'draft' | 'pending-review';
  meta: Record<string, string>;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: AdminRole | 'PUBLIC_SYSTEM';
  action: string;
  module: string;
  targetId: string;
  summary: string;
}

export interface SystemSettingsRecord {
  registrationOpen: boolean;
  requireVolunteerApproval: boolean;
  maintenanceBanner: string;
  defaultVoiceGender: 'female' | 'male';
  backupRetentionDays: number;
}

export interface PlatformDatabase {
  users: AdminUserRecord[];
  participants: ParticipantRecord[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  volunteers: VolunteerRecord[];
  memberships: MembershipRecord[];
  media: ManagedMediaRecord[];
  cmsItems: CmsManagedItem[];
  pages: PageInventoryRecord[];
  carousels: CarouselConfigRecord[];
  mediaAssets: MediaAssetRecord[];
  scriptureChapters: ScriptureChapterOverride[];
  scriptureVerses: CmsScriptureVerseRecord[];
  storyScenes: StorySceneOverride[];
  collections: StructuredCollectionItem[];
  revisions: ContentRevisionRecord[];
  auditLogs: AuditLogRecord[];
  webhookEvents: WebhookEventRecord[];
  entryPasses: EntryPassRecord[];
  participantNotifications: ParticipantNotificationRecord[];
  settings: SystemSettingsRecord;
}

const BUILTIN_VISUAL_STUDY_SEEDS: ReadonlyArray<
  Pick<
    MediaAssetRecord,
    'id' | 'assetKey' | 'category' | 'title' | 'description' | 'altText' | 'caption' | 'tags' | 'focalPoint' | 'featured'
  >
> = [
  {
    id: 'asset-hero-pavilion',
    assetKey: 'heroPavilion',
    category: 'festival',
    title: 'Bhagavad Gita Vishwa Mahotsav Pavilion (Desktop)',
    description: 'Primary sunlit sandstone cultural pavilion above reflective courtyard basin.',
    altText: 'Illuminated sandstone and gold pavilion rising at dusk above reflective courtyard waters',
    caption: 'Hyderabad Cultural Pavilion Concept',
    tags: ['hero', 'pavilion', 'hyderabad'],
    focalPoint: '50% 60%',
    featured: true,
  },
  {
    id: 'asset-hero-pavilion-mobile',
    assetKey: 'heroPavilionMobile',
    category: 'festival',
    title: 'Bhagavad Gita Vishwa Mahotsav Pavilion (Mobile)',
    description: 'Portrait architectural pavilion framing for mobile screens.',
    altText: 'Portrait view of sandstone and antique gold cultural pavilion at sunset',
    caption: 'Mobile Pavilion Plate',
    tags: ['hero', 'mobile', 'pavilion'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-kurukshetra-dialogue',
    assetKey: 'heroKurukshetraDialogue',
    category: 'mahabharata',
    title: 'Lord Krishna & Arjuna — Chariot of Kurukshetra',
    description: 'Classical study depicting Lord Krishna imparting the Bhagavad Gita to Arjuna beside their chariot.',
    altText: 'Classical oil painting of Lord Krishna imparting the wisdom of the Bhagavad Gita to Arjuna beside their chariot at dawn',
    caption: 'The Divine Dialogue',
    tags: ['hero', 'krishna', 'arjuna', 'mahabharata'],
    focalPoint: '50% 35%',
    featured: true,
  },
  {
    id: 'asset-vishvarupa',
    assetKey: 'heroVishvarupaVision',
    category: 'mahabharata',
    title: 'Vishvarupa Darshana — Chapter XI Cosmic Harmony',
    description: 'Monumental sacred iconography of the Cosmic Form framed by celestial astronomical rings.',
    altText: 'Monumental sacred Indian painting of the cosmic Vishvarupa form encircled by golden astronomical mandalas',
    caption: 'The Universal Vision',
    tags: ['hero', 'vishvarupa', 'chapter-11'],
    focalPoint: '50% 32%',
    featured: true,
  },
  {
    id: 'asset-temple-sanctum',
    assetKey: 'heroAncientTempleSanctum',
    category: 'temples',
    title: 'Ancient Carved Sandstone Mandapa',
    description: 'Sunbeams piercing incense inside an ancient carved stone Indian temple hall.',
    altText: 'Sunbeams illuminating carved ancient Indian sandstone temple pillars and brass oil lamps',
    caption: 'Sanctum Architecture',
    tags: ['temple', 'sanctum', 'pillars'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-eternal-gita-vol',
    assetKey: 'eternalGitaVolume',
    category: 'manuscripts',
    title: 'Gold-Embossed Eternal Bhagavad Gita Edition',
    description: 'Commemorative gold-bound volume of the 700-verse Gita on carved sandstone pedestal.',
    altText: 'Illuminated sacred edition of the Bhagavad Gita resting upon a sculpted pedestal in quiet light',
    caption: 'Eternal Royal Edition',
    tags: ['gita', 'book', 'hero'],
    focalPoint: '50% 45%',
    featured: true,
  },
  {
    id: 'asset-ivory-mountain',
    assetKey: 'ivoryMountainMist',
    category: 'temples',
    title: 'Himalayan Morning Mist Sanctuary Study',
    description: 'Serene ivory atmosphere plate for contemplative section transitions.',
    altText: 'Misty sacred mountain horizon at dawn in soft gold and ivory tones',
    caption: 'Atmospheric Horizon',
    tags: ['atmosphere', 'mist'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-pavilion-atrium',
    assetKey: 'sandstoneGallery',
    category: 'temples',
    title: 'Sandstone Pavilion Colonnade Atrium',
    description: 'Quiet monumental gallery colonnade of carved cream-sandstone arches.',
    altText: 'Monumental carved sandstone atrium bathed in soft natural light',
    caption: 'Exhibition Colonnade',
    tags: ['temple', 'atrium', 'gallery'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-manuscript-craft',
    assetKey: 'manuscriptCraft',
    category: 'manuscripts',
    title: 'Tied Palm-Leaf Manuscript Tradition (Tala-Patra)',
    description: 'Centuries-old Sanskrit palm-leaf folio craftsmanship preserving verses in gold ink.',
    altText: 'Close study of preserved ancient Sanskrit palm-leaf manuscripts crafted in traditional gold ink',
    caption: 'Tala-Patra Preservation',
    tags: ['manuscript', 'sanskrit', 'archive'],
    focalPoint: '50% 50%',
    featured: true,
  },
  {
    id: 'asset-twilight-sanctum',
    assetKey: 'eveningSanctum',
    category: 'temples',
    title: 'Evening Sanctum & Reflection Basin',
    description: 'Warm sandstone sanctuary glowing beside calm twilight waters.',
    altText: 'Twilight reflection basin before an illuminated sandstone sanctuary',
    caption: 'Closing Sanctum',
    tags: ['hero', 'twilight', 'sanctum'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-reg-sanctum-bg',
    assetKey: 'registrationSanctumBg',
    category: 'temples',
    title: 'Registration Mandate Sanctum Horizon',
    description: 'Architectural backdrop framing delegate enrollment forms.',
    altText: 'Warm sandstone colonnade courtyard prepared for international delegates',
    caption: 'Delegate Courtyard',
    tags: ['registration', 'backdrop'],
    focalPoint: '50% 50%',
    featured: false,
  },
  {
    id: 'asset-reg-mobile',
    assetKey: 'registrationKurukshetraMobile',
    category: 'mahabharata',
    title: 'Kurukshetra Portrait Study (Mobile)',
    description: 'Portrait framing for mobile registration and contemplative cards.',
    altText: 'Vertical devotional study of golden Kurukshetra dawn light',
    caption: 'Mobile Registration Backdrop',
    tags: ['registration', 'mobile'],
    focalPoint: '50% 45%',
    featured: false,
  },
  {
    id: 'asset-devi-saraswati',
    assetKey: 'cultureSaraswatiHeritage',
    category: 'devis',
    title: 'Devi Saraswati — Wisdom, Sacred Speech & Arts',
    description: 'Classical museum painting of Devi Saraswati with veena and palm-leaf scripture.',
    altText: 'Museum painting of Devi Saraswati seated upon an ivory lotus holding a veena and sacred manuscript',
    caption: 'Devi Saraswati Iconography',
    tags: ['devi', 'saraswati', 'gallery'],
    focalPoint: '50% 35%',
    featured: true,
  },
  {
    id: 'asset-devi-lakshmi',
    assetKey: 'cultureLakshmiHeritage',
    category: 'devis',
    title: 'Devi Lakshmi — Auspicious Grace & Prosperity',
    description: 'Sacred lotus iconography honoring dharma-aligned abundance and temple lamps.',
    altText: 'Classical painting of Devi Lakshmi seated on a blooming pink lotus above serene temple reflection waters lit by brass diyas',
    caption: 'Devi Lakshmi Iconography',
    tags: ['devi', 'lakshmi', 'gallery'],
    focalPoint: '50% 35%',
    featured: true,
  },
  {
    id: 'asset-maa-durga',
    assetKey: 'cultureDurgaHeritage',
    category: 'devis',
    title: 'Maa Durga — Sovereign Courage & Protection',
    description: 'Traditional sandstone temple study celebrating inner strength and dharmic resolve.',
    altText: 'Classical painting of Maa Durga beneath a carved Indian sandstone temple arch with her peaceful lion companion',
    caption: 'Maa Durga Iconography',
    tags: ['devi', 'durga', 'gallery'],
    focalPoint: '50% 35%',
    featured: true,
  },
  {
    id: 'asset-youth-forum',
    assetKey: 'heroYouthGitaForum',
    category: 'festival',
    title: 'Youth & University Gita Dialogue (15–35)',
    description: 'International student and youth delegates collaborating around ethics dialogues.',
    altText: 'International students and youth delegates gathered around Bhagavad Gita dialogue tables inside a sunlit stone hall',
    caption: 'Youth Gita Forum',
    tags: ['hero', 'youth', 'forum'],
    focalPoint: '50% 42%',
    featured: false,
  },
  {
    id: 'asset-global-parayana',
    assetKey: 'heroGlobalParayanaSanctum',
    category: 'festival',
    title: '18-Nation Synchronized Parayana Sanctum',
    description: 'Candlelit assembly hall uniting voices in collective chapter recitation.',
    altText: 'Sacred evening parayana assembly with brass lamps illuminated beneath carved sandstone arches',
    caption: 'Global Parayana',
    tags: ['hero', 'parayana', '18-countries'],
    focalPoint: '50% 45%',
    featured: true,
  },
  {
    id: 'asset-lord-krishna-portrait',
    assetKey: 'lordKrishnaPortrait',
    category: 'mahabharata',
    title: 'Sri Krishna — Peacock Crown & Sacred Flute',
    description: 'Primary devotional plate featured in the Homepage Spiritual Image Carousel.',
    altText: 'Classical Indian devotional painting of Lord Krishna holding a golden flute inside a carved sandstone mandapa',
    caption: 'The Eternal Wisdom',
    tags: ['spiritual-carousel', 'krishna', 'portrait'],
    focalPoint: '50% 22%',
    featured: true,
  },
  {
    id: 'asset-open-gita-book',
    assetKey: 'openBhagavadGitaBook',
    category: 'manuscripts',
    title: 'Open Illuminated Bhagavad Gita & Brass Diya',
    description: 'Open Sanskrit folio illuminated by warm temple lamp.',
    altText: 'Open antique Bhagavad Gita volume resting on a carved wooden bookstand lit by a brass lamp',
    caption: 'The Sacred Scripture',
    tags: ['spiritual-carousel', 'gita', 'scripture'],
    focalPoint: '50% 48%',
    featured: true,
  },
  {
    id: 'asset-kurukshetra-dawn',
    assetKey: 'kurukshetraSacredBattlefield',
    category: 'mahabharata',
    title: 'Kurukshetra — Sacred Dawn of Awakening',
    description: 'Sunrise breaking across the historical plain of Kurukshetra with ancient banners.',
    altText: 'Golden sunrise breaking across the sacred plain of Kurukshetra with ancient Vedic banners and chariots',
    caption: 'Kurukshetra Dawn',
    tags: ['spiritual-carousel', 'kurukshetra'],
    focalPoint: '50% 52%',
    featured: false,
  },
  {
    id: 'asset-krishna-teaching-arjuna',
    assetKey: 'krishnaTeachingArjuna',
    category: 'mahabharata',
    title: 'Lord Krishna Teaching Arjuna in Chinmudra',
    description: 'Calm instructional moment on the chariot symbolizing Chapter XVIII closure.',
    altText: 'Classical Indian artwork of Lord Krishna in chinmudra calmly teaching Arjuna beside their chariot',
    caption: 'Chinmudra Discourse',
    tags: ['spiritual-carousel', 'krishna', 'arjuna'],
    focalPoint: '50% 32%',
    featured: true,
  },
];

function buildInitialCollections(): StructuredCollectionItem[] {
  const now = '2026-06-01T00:00:00.000Z';
  const items: StructuredCollectionItem[] = [];

  OFFICIAL_EVENTS_PROGRAM.forEach((ev, idx) => {
    items.push({
      id: `evt-${ev.id}`,
      kind: 'events',
      title: ev.title.en,
      subtitle: ev.subtitle.en,
      description: ev.description.en,
      dateLabel: ev.dateDisplay.en,
      locationLabel: ev.location?.en ?? 'Hyderabad (Pending Final Release)',
      badgeLabel: ev.format.toUpperCase(),
      href: '/program',
      language: 'en',
      order: idx + 1,
      featured: idx < 2,
      status: 'published',
      meta: {
        isoDate: ev.isoDate,
        category: ev.category,
        approvalStatus: ev.status,
      },
      updatedAt: now,
    });
  });

  OFFICIAL_SCHEDULE_LEDGER.forEach((sch, idx) => {
    items.push({
      id: `sch-${sch.id}`,
      kind: 'schedule',
      title: sch.title.en,
      subtitle: sch.venue?.en ?? 'Hyderabad · Venue Confirmation Pending',
      description: `Scheduled track for event ${sch.eventId}.`,
      dateLabel: sch.isoDate,
      locationLabel: sch.venue?.en ?? 'Hyderabad · Venue Confirmation Pending',
      badgeLabel: sch.timeSlot ?? 'Timing Pending Sign-off',
      language: 'en',
      order: idx + 1,
      featured: sch.status === 'confirmed',
      status: 'published',
      meta: {
        eventId: sch.eventId,
        isoDate: sch.isoDate,
        approvalStatus: sch.status,
      },
      updatedAt: now,
    });
  });

  MOVEMENT_TEN_PATHWAYS.forEach((p, idx) => {
    items.push({
      id: `part-${p.id}`,
      kind: 'participation',
      title: p.title.en,
      subtitle: p.subtitle.en,
      description: p.description.en,
      badgeLabel: p.categoryGroup.toUpperCase(),
      href: p.actionHref,
      language: 'en',
      order: idx + 1,
      featured: idx < 5,
      status: 'published',
      meta: {
        registrationType: p.registrationType,
        ctaLabel: p.ctaLabel.en,
        actionKind: p.actionKind,
      },
      updatedAt: now,
    });
  });

  VERIFIED_ORGANISING_COMMITTEE.forEach((leader, idx) => {
    items.push({
      id: `ldr-${leader.id}`,
      kind: 'leadership',
      title: leader.name,
      subtitle: leader.designation,
      description: leader.bio,
      badgeLabel: leader.roleLabel,
      href: leader.sourcePortalPath,
      language: 'en',
      order: idx + 1,
      featured: true,
      status: 'published',
      meta: {
        category: leader.category,
        approvalStatus: leader.status,
      },
      updatedAt: now,
    });
  });

  VERIFIED_ORGANIZING_PARTNERS.forEach((partner, idx) => {
    items.push({
      id: `ptr-${partner.id}`,
      kind: 'partners',
      title: partner.name,
      subtitle: `${partner.tier.toUpperCase()} Partner`,
      description: `Verified organising partner listed on official Mahotsav charters.`,
      badgeLabel: partner.tier.toUpperCase(),
      href: partner.websiteUrl ?? undefined,
      language: 'en',
      order: idx + 1,
      featured: true,
      status: 'published',
      meta: {
        tier: partner.tier,
        approvalStatus: partner.status,
      },
      updatedAt: now,
    });
  });

  OFFICIAL_ANNOUNCEMENTS.forEach((ann, idx) => {
    items.push({
      id: `ann-${ann.id}`,
      kind: 'announcements',
      title: ann.title.en,
      subtitle: `Published Bulletin · ${ann.isoDate}`,
      description: ann.summary.en,
      dateLabel: ann.isoDate,
      badgeLabel: ann.status.toUpperCase(),
      language: 'en',
      order: idx + 1,
      featured: true,
      status: 'published',
      meta: {
        isoDate: ann.isoDate,
        approvalStatus: ann.status,
      },
      updatedAt: now,
    });
  });

  OFFICIAL_FAQS.forEach((faq, idx) => {
    items.push({
      id: `faq-${faq.id}`,
      kind: 'faqs',
      title: faq.question.en,
      subtitle: faq.category.toUpperCase(),
      description: faq.answer.en,
      badgeLabel: faq.category,
      language: 'en',
      order: idx + 1,
      featured: idx < 3,
      status: 'published',
      meta: {
        category: faq.category,
      },
      updatedAt: now,
    });
  });

  return items;
}

function buildInitialMediaAssets(
  pages: PageInventoryRecord[],
  carousels: CarouselConfigRecord[],
): MediaAssetRecord[] {
  const now = '2026-06-01T00:00:00.000Z';
  const assets: MediaAssetRecord[] = [];

  for (const seed of BUILTIN_VISUAL_STUDY_SEEDS) {
    const temp: MediaAssetRecord = {
      id: seed.id,
      assetKey: seed.assetKey,
      kind: 'image',
      category: seed.category,
      title: seed.title,
      description: seed.description,
      altText: seed.altText,
      caption: seed.caption,
      copyright: '© Project Eternal · Commissioned Classical Archive',
      source: 'Project Eternal Visual Manifest',
      language: 'English · Multilingual',
      tags: seed.tags,
      url: `asset://${seed.assetKey}`,
      focalPoint: seed.focalPoint,
      featured: seed.featured,
      published: true,
      usageLocations: [],
      createdAt: now,
      updatedAt: now,
    };
    temp.usageLocations = computeMediaUsageLocations(temp, pages, carousels);
    assets.push(temp);
  }

  for (const storyAsset of STORY_ASSET_LIST) {
    const temp: MediaAssetRecord = {
      id: `asset-story-${storyAsset.sceneId}`,
      assetKey: `story:${storyAsset.sceneId}`,
      kind: 'image',
      category: 'story',
      title: `Story Scene ${storyAsset.sceneNumber} Plate`,
      description: storyAsset.continuityNotes,
      altText: storyAsset.alt.en,
      caption: `Kurukshetra Chapter Plate ${storyAsset.sceneNumber}`,
      copyright: '© Project Eternal · 3D Story Archive',
      source: 'Curated Story Manifest',
      language: 'EN · HI · TE',
      tags: ['story', storyAsset.sceneId, storyAsset.motionDirection],
      url: storyAsset.primaryImageSrc,
      focalPoint: storyAsset.objectPosition,
      featured: storyAsset.sceneNumber <= 4,
      published: true,
      usageLocations: [],
      createdAt: now,
      updatedAt: now,
    };
    temp.usageLocations = computeMediaUsageLocations(temp, pages, carousels);
    assets.push(temp);
  }

  return assets;
}

export function buildCanonicalScriptureChapters(): ScriptureChapterOverride[] {
  const now = '2026-06-01T00:00:00.000Z';
  return GITA_CHAPTER_CATALOG.map((ch) => ({
    chapterNumber: ch.chapterNumber,
    titleEn: ch.title.en,
    titleSanskrit: ch.sanskritDevanagari,
    titleHi: ch.title.hi,
    titleTe: ch.title.te,
    summaryEn: ch.essence.en,
    summaryHi: ch.essence.hi,
    summaryTe: ch.essence.te,
    keyTeaching: `${ch.transliteration} · ${ch.verseCount} Shlokas`,
    featuredVerseRef: `Chapter ${ch.romanNumeral}`,
    verseCount: ch.verseCount,
    audioUrl: ch.approvedAudioUrl ?? undefined,
    status: 'published',
    updatedAt: now,
  }));
}

export function buildCanonicalScriptureVerses(): CmsScriptureVerseRecord[] {
  const now = '2026-06-01T00:00:00.000Z';
  return CANONICAL_GITA_VERSES.map((v) => ({
    id: v.id,
    chapterNumber: v.chapter,
    verseNumber: v.verse,
    sanskritDevanagari: v.sanskritDevanagari,
    transliteration: v.transliteration,
    translationEn: v.translationEn,
    translationHi: v.meaningHi,
    translationTe: v.meaningTe,
    commentaryNote: v.commentarySlot?.en ?? '',
    audioUrl: v.audioRecitationUrl ?? undefined,
    status: 'published',
    updatedAt: now,
  }));
}

export function buildCanonicalStoryScenes(): StorySceneOverride[] {
  const now = '2026-06-01T00:00:00.000Z';
  return STORY_SCENES.map((scene) => {
    const storyAsset = STORY_ASSET_LIST.find((a) => a.sceneId === scene.id);
    return {
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      title: {
        en: scene.title.en,
        hi: scene.title.hi,
        te: scene.title.te,
      },
      chapterTag: scene.chaptersReferenced,
      dialogue: {
        en: scene.cues.map((c) => c.text.en).join(' '),
        hi: scene.cues.map((c) => c.text.hi).join(' '),
        te: scene.cues.map((c) => c.text.te).join(' '),
      },
      narration: {
        en: scene.atmosphereNote.en,
        hi: scene.atmosphereNote.hi,
        te: scene.atmosphereNote.te,
      },
      primaryImageUrl: storyAsset?.primaryImageSrc ?? '/assets/aistudio/image_a59e30de.png',
      status: 'published',
      updatedAt: now,
    };
  });
}

export function ensureCanonicalSeedData(db: PlatformDatabase): {
  addedPages: number;
  addedCarousels: number;
  addedAssets: number;
  addedChapters: number;
  addedVerses: number;
  addedScenes: number;
  addedCollections: number;
} {
  let addedPages = 0;
  let addedCarousels = 0;
  let addedAssets = 0;
  let addedChapters = 0;
  let addedVerses = 0;
  let addedScenes = 0;
  let addedCollections = 0;

  if (!Array.isArray(db.pages)) db.pages = [];
  for (const canonicalPage of CANONICAL_PUBLIC_PAGES) {
    if (!db.pages.some((p) => p.id === canonicalPage.id || p.route === canonicalPage.route)) {
      db.pages.push(JSON.parse(JSON.stringify(canonicalPage)) as PageInventoryRecord);
      addedPages += 1;
    }
  }

  if (!Array.isArray(db.carousels)) db.carousels = [];
  for (const canonicalCarousel of CANONICAL_CAROUSELS) {
    if (!db.carousels.some((c) => c.id === canonicalCarousel.id)) {
      db.carousels.push(JSON.parse(JSON.stringify(canonicalCarousel)) as CarouselConfigRecord);
      addedCarousels += 1;
    }
  }

  if (!Array.isArray(db.mediaAssets)) db.mediaAssets = [];
  const builtMedia = buildInitialMediaAssets(db.pages, db.carousels);
  for (const asset of builtMedia) {
    if (!db.mediaAssets.some((m) => m.id === asset.id)) {
      db.mediaAssets.push(asset);
      addedAssets += 1;
    }
  }

  if (!Array.isArray(db.scriptureChapters)) db.scriptureChapters = [];
  for (const ch of buildCanonicalScriptureChapters()) {
    if (!db.scriptureChapters.some((c) => c.chapterNumber === ch.chapterNumber)) {
      db.scriptureChapters.push(ch);
      addedChapters += 1;
    }
  }

  if (!Array.isArray(db.scriptureVerses)) db.scriptureVerses = [];
  for (const v of buildCanonicalScriptureVerses()) {
    if (!db.scriptureVerses.some((existing) => existing.id === v.id)) {
      db.scriptureVerses.push(v);
      addedVerses += 1;
    }
  }

  if (!Array.isArray(db.storyScenes)) db.storyScenes = [];
  for (const s of buildCanonicalStoryScenes()) {
    if (!db.storyScenes.some((existing) => existing.id === s.id)) {
      db.storyScenes.push(s);
      addedScenes += 1;
    }
  }

  if (!Array.isArray(db.collections)) db.collections = [];
  for (const item of buildInitialCollections()) {
    if (!db.collections.some((existing) => existing.id === item.id)) {
      db.collections.push(item);
      addedCollections += 1;
    }
  }

  if (!Array.isArray(db.revisions)) db.revisions = [];
  if (!Array.isArray(db.webhookEvents)) db.webhookEvents = [];
  for (const payment of db.payments) {
    if (!('gatewayOrderId' in payment)) {
      (payment as PaymentRecord).gatewayOrderId = null;
    }
  }

  return {
    addedPages,
    addedCarousels,
    addedAssets,
    addedChapters,
    addedVerses,
    addedScenes,
    addedCollections,
  };
}

export function createInitialDatabase(bootstrapPassword?: string): PlatformDatabase {
  const adminEmail =
    process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || 'admin@eternal2027.org';
  const explicitPassword = bootstrapPassword?.trim() || process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();

  // No predictable default credential: if no operator-supplied bootstrap password is
  // configured, generate a random one-time password and force it to be rotated on first
  // login, instead of silently provisioning a well-known SUPER_ADMIN password.
  let adminPass = explicitPassword;
  let mustChangePassword = false;
  if (!adminPass) {
    adminPass = crypto.randomBytes(18).toString('base64url');
    mustChangePassword = true;
    // eslint-disable-next-line no-console
    console.warn(
      '\n[bootstrap] ADMIN_BOOTSTRAP_PASSWORD was not set. A one-time SUPER_ADMIN password ' +
        'has been generated for first login:\n' +
        `  email:    ${adminEmail}\n` +
        `  password: ${adminPass}\n` +
        '  This password is shown only once and will not be recoverable after this process ' +
        'exits. Log in immediately and set a permanent password, or set ADMIN_BOOTSTRAP_EMAIL ' +
        '/ ADMIN_BOOTSTRAP_PASSWORD in your environment before the next fresh boot.\n',
    );
  }

  const db: PlatformDatabase = {
    users: [
      {
        id: 'usr-super-1',
        name: 'Mahotsav Chief Administrator',
        email: adminEmail,
        role: 'SUPER_ADMIN',
        passwordHash: hashPassword(adminPass),
        active: true,
        mustChangePassword,
        passwordUpdatedAt: mustChangePassword ? null : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      },
    ],
    participants: [],
    payments: [],
    refunds: [],
    volunteers: [],
    memberships: [],
    media: [],
    cmsItems: [],
    pages: [],
    carousels: [],
    mediaAssets: [],
    scriptureChapters: [],
    scriptureVerses: [],
    storyScenes: [],
    collections: [],
    revisions: [],
    auditLogs: [],
    webhookEvents: [],
    entryPasses: [],
    participantNotifications: [],
    settings: {
      registrationOpen: true,
      requireVolunteerApproval: true,
      maintenanceBanner: '',
      defaultVoiceGender: 'female',
      backupRetentionDays: 30,
    },
  };

  ensureCanonicalSeedData(db);
  return db;
}

export function sanitizeCsvCell(val: unknown): string {
  const str = String(val ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function serializeRecordsToCsv(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
): string {
  const headLine = headers.map(sanitizeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headLine, ...bodyLines].join('\r\n');
}

export function serializeRecordsToExcelXml(
  sheetName: string,
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
): string {
  const escapeXml = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((r) => {
      const cells = r
        .map((cell) => {
          const isNum = typeof cell === 'number' && Number.isFinite(cell);
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${escapeXml(sheetName.slice(0, 30))}">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export class PlatformStore {
  private dbPath: string;
  private backupDir: string;
  private db: PlatformDatabase;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.dbPath = path.join(dataDir, 'platform-db.json');
    this.backupDir = path.join(dataDir, 'backups');
    fs.mkdirSync(this.backupDir, { recursive: true });
    this.db = this.load();
  }

  private load(): PlatformDatabase {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PlatformDatabase>;
        // Only actually mint a new bootstrap SUPER_ADMIN (and print its one-time password)
        // when the loaded file genuinely has no admin users — otherwise this "fresh" value
        // is just a defaults skeleton for other fields, and a real admin already exists on
        // disk, so generating and discarding a brand-new random password on every normal
        // restart would be pure noise (and misleadingly alarming in server logs).
        const hasExistingUsers = Array.isArray(parsed.users) && parsed.users.length > 0;
        const fresh = hasExistingUsers
          ? createInitialDatabase('unused-skeleton-placeholder-password')
          : createInitialDatabase();
        const merged: PlatformDatabase = {
          ...fresh,
          ...parsed,
          users:
            Array.isArray(parsed.users) && parsed.users.length > 0
              ? parsed.users
              : fresh.users,
          pages: Array.isArray(parsed.pages) ? parsed.pages : [],
          carousels: Array.isArray(parsed.carousels) ? parsed.carousels : [],
          mediaAssets: Array.isArray(parsed.mediaAssets) ? parsed.mediaAssets : [],
          scriptureChapters: Array.isArray(parsed.scriptureChapters)
            ? parsed.scriptureChapters
            : [],
          scriptureVerses: Array.isArray(parsed.scriptureVerses) ? parsed.scriptureVerses : [],
          storyScenes: Array.isArray(parsed.storyScenes) ? parsed.storyScenes : [],
          collections: Array.isArray(parsed.collections) ? parsed.collections : [],
          revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
          webhookEvents: Array.isArray(parsed.webhookEvents) ? parsed.webhookEvents : [],
          entryPasses: Array.isArray(parsed.entryPasses) ? parsed.entryPasses : [],
          participantNotifications: Array.isArray(parsed.participantNotifications)
            ? parsed.participantNotifications
            : [],
          settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
        };
        const migration = ensureCanonicalSeedData(merged);
        if (
          migration.addedPages +
            migration.addedCarousels +
            migration.addedAssets +
            migration.addedChapters +
            migration.addedVerses +
            migration.addedScenes +
            migration.addedCollections >
          0
        ) {
          this.persistSync(merged);
        }
        return merged;
      }
    } catch {
      // Fallback cleanly to initial state if corrupt
    }
    const init = createInitialDatabase();
    this.persistSync(init);
    return init;
  }

  public appendRevision(
    entry: Omit<ContentRevisionRecord, 'id' | 'createdAt'>,
  ): ContentRevisionRecord {
    const rev: ContentRevisionRecord = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.db.revisions.unshift(rev);
    if (this.db.revisions.length > 500) {
      this.db.revisions.length = 500;
    }
    this.save();
    return rev;
  }

  private persistSync(snapshot: PlatformDatabase): void {
    const tmpPath = `${this.dbPath}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.dbPath);
  }

  public save(): void {
    this.persistSync(this.db);
  }

  public getSnapshot(): PlatformDatabase {
    return this.db;
  }

  public appendAudit(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): AuditLogRecord {
    const log: AuditLogRecord = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.db.auditLogs.unshift(log);
    if (this.db.auditLogs.length > 2000) {
      this.db.auditLogs.length = 2000;
    }
    this.save();
    return log;
  }

  /**
   * Idempotency guard for payment webhooks: gateways routinely retry the same delivery
   * (e.g. on a slow or dropped response), and re-applying it would double-process a refund
   * or payment status change. Keyed by a hash of the raw request body rather than any
   * particular gateway's event-id header, so it works uniformly across providers.
   */
  public hasProcessedWebhookEvent(bodyHash: string): boolean {
    return this.db.webhookEvents.some((e) => e.bodyHash === bodyHash);
  }

  public recordWebhookEvent(entry: Omit<WebhookEventRecord, 'receivedAt'>): void {
    this.db.webhookEvents.unshift({ ...entry, receivedAt: new Date().toISOString() });
    if (this.db.webhookEvents.length > 5000) {
      this.db.webhookEvents.length = 5000;
    }
    this.save();
  }

  public createBackup(): { fileName: string; createdAt: string; sizeBytes: number } {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${stamp}.json`;
    const target = path.join(this.backupDir, fileName);
    const payload = JSON.stringify(this.db, null, 2);
    fs.writeFileSync(target, payload, 'utf8');
    return {
      fileName,
      createdAt: new Date().toISOString(),
      sizeBytes: Buffer.byteLength(payload, 'utf8'),
    };
  }

  public listBackups(): Array<{ fileName: string; sizeBytes: number; modifiedAt: string }> {
    try {
      return fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith('.json'))
        .map((fileName) => {
          const st = fs.statSync(path.join(this.backupDir, fileName));
          return {
            fileName,
            sizeBytes: st.size,
            modifiedAt: st.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    } catch {
      return [];
    }
  }

  public restoreBackup(fileName: string): boolean {
    const safeName = path.basename(fileName);
    const target = path.join(this.backupDir, safeName);
    if (!fs.existsSync(target)) return false;
    const raw = fs.readFileSync(target, 'utf8');
    const parsed = JSON.parse(raw) as PlatformDatabase;
    if (!Array.isArray(parsed.users)) return false;
    this.db = parsed;
    this.save();
    return true;
  }
}
