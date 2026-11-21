import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// Schema derived directly from the TypeScript record types already defined in
// server/store.ts and src/utils/cmsSync.ts (see PROJECT_ETERNAL_DATABASE_ASSESSMENT.md §3-4).
// No fields are invented beyond what those interfaces already carry.

export const adminUsers = mysqlTable('admin_users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: mysqlEnum('role', [
    'SUPER_ADMIN',
    'EVENT_ADMIN',
    'REGISTRATION_MANAGER',
    'FINANCE_MANAGER',
    'VOLUNTEER_MANAGER',
    'CONTENT_EDITOR',
    'MEDIA_MANAGER',
    'AUDITOR',
  ]).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  passwordUpdatedAt: timestamp('password_updated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
}, (t) => [uniqueIndex('admin_users_email_idx').on(t.email)]);

export const revokedTokens = mysqlTable('revoked_tokens', {
  tokenHash: varchar('token_hash', { length: 128 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
}, (t) => [index('revoked_tokens_expires_idx').on(t.expiresAt)]);

export const participants = mysqlTable('participants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }).notNull(),
  noOfPersons: int('no_of_persons').notNull(),
  donationAmountInr: int('donation_amount_inr').notNull(),
  registrationType: varchar('registration_type', { length: 40 }).notNull(),
  country: varchar('country', { length: 120 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  assistanceVisa: boolean('assistance_visa').notNull().default(false),
  assistanceAccommodation: boolean('assistance_accommodation').notNull().default(false),
  assistanceLocalTransport: boolean('assistance_local_transport').notNull().default(false),
  eventsCurtainRaiser: boolean('events_curtain_raiser').notNull().default(false),
  eventsMahotsav: boolean('events_mahotsav').notNull().default(false),
  preferredLanguage: varchar('preferred_language', { length: 10 }),
  familyOrGroupMembers: text('family_or_group_members'),
  organisationName: varchar('organisation_name', { length: 200 }),
  organisationRole: varchar('organisation_role', { length: 120 }),
  volunteerSkills: text('volunteer_skills'),
  parayanaCity: varchar('parayana_city', { length: 120 }),
  assistanceNotes: text('assistance_notes'),
  verificationStatus: varchar('verification_status', { length: 40 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 40 }).notNull(),
  referenceCode: varchar('reference_code', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('participants_reference_code_idx').on(t.referenceCode)]);

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  participantId: varchar('participant_id', { length: 64 }).notNull(),
  participantName: varchar('participant_name', { length: 200 }).notNull(),
  amountInr: int('amount_inr').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  gateway: varchar('gateway', { length: 40 }).notNull(),
  gatewayReference: varchar('gateway_reference', { length: 120 }).notNull(),
  gatewayOrderId: varchar('gateway_order_id', { length: 120 }),
  status: varchar('status', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('payments_participant_idx').on(t.participantId)]);

export const refunds = mysqlTable('refunds', {
  id: varchar('id', { length: 64 }).primaryKey(),
  paymentId: varchar('payment_id', { length: 64 }).notNull(),
  amountInr: int('amount_inr').notNull(),
  reason: text('reason').notNull(),
  approvedBy: varchar('approved_by', { length: 255 }).notNull(),
  status: varchar('status', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('refunds_payment_idx').on(t.paymentId)]);

export const volunteers = mysqlTable('volunteers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }).notNull(),
  country: varchar('country', { length: 120 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  department: varchar('department', { length: 60 }).notNull(),
  volunteerBadgeId: varchar('volunteer_badge_id', { length: 40 }).notNull(),
  approvalStatus: varchar('approval_status', { length: 40 }).notNull(),
  attendanceCount: int('attendance_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('volunteers_badge_id_idx').on(t.volunteerBadgeId)]);

export const memberships = mysqlTable('memberships', {
  id: varchar('id', { length: 64 }).primaryKey(),
  memberName: varchar('member_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  tier: varchar('tier', { length: 40 }).notNull(),
  country: varchar('country', { length: 120 }).notNull(),
  status: varchar('status', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const mediaAssets = mysqlTable('media_assets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  assetKey: varchar('asset_key', { length: 120 }),
  kind: varchar('kind', { length: 20 }).notNull(),
  category: varchar('category', { length: 40 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  altText: varchar('alt_text', { length: 300 }),
  caption: varchar('caption', { length: 300 }),
  copyright: varchar('copyright', { length: 200 }),
  source: varchar('source', { length: 200 }),
  language: varchar('language', { length: 10 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  focalPoint: varchar('focal_point', { length: 40 }),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('media_assets_asset_key_idx').on(t.assetKey)]);

export const mediaAssetTags = mysqlTable('media_asset_tags', {
  id: int('id').autoincrement().primaryKey(),
  mediaAssetId: varchar('media_asset_id', { length: 64 }).notNull(),
  tag: varchar('tag', { length: 80 }).notNull(),
}, (t) => [index('media_asset_tags_asset_idx').on(t.mediaAssetId)]);

export const mediaUsage = mysqlTable('media_usage', {
  id: int('id').autoincrement().primaryKey(),
  mediaAssetId: varchar('media_asset_id', { length: 64 }).notNull(),
  location: varchar('location', { length: 300 }).notNull(),
}, (t) => [index('media_usage_asset_idx').on(t.mediaAssetId)]);

export const managedMedia = mysqlTable('managed_media', {
  id: varchar('id', { length: 64 }).primaryKey(),
  kind: varchar('kind', { length: 20 }).notNull(),
  category: varchar('category', { length: 40 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  language: varchar('language', { length: 10 }).notNull(),
  copyright: varchar('copyright', { length: 200 }),
  source: varchar('source', { length: 200 }),
  altText: varchar('alt_text', { length: 300 }),
  url: varchar('url', { length: 500 }).notNull(),
  focalPoint: varchar('focal_point', { length: 40 }),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pages = mysqlTable('pages', {
  id: varchar('id', { length: 64 }).primaryKey(),
  slug: varchar('slug', { length: 200 }).notNull(),
  route: varchar('route', { length: 200 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 40 }).notNull(),
  cmsConnected: boolean('cms_connected').notNull().default(true),
  syncStatus: varchar('sync_status', { length: 40 }).notNull(),
  status: varchar('status', { length: 40 }).notNull(),
  hasUnpublishedDraft: boolean('has_unpublished_draft').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  updatedBy: varchar('updated_by', { length: 255 }),
}, (t) => [uniqueIndex('pages_slug_idx').on(t.slug), uniqueIndex('pages_route_idx').on(t.route)]);

export const pageVersions = mysqlTable('page_versions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  pageId: varchar('page_id', { length: 64 }).notNull(),
  versionKind: mysqlEnum('version_kind', ['published', 'draft']).notNull(),
  titleJson: json('title_json').notNull(),
  subtitleJson: json('subtitle_json'),
  summaryJson: json('summary_json'),
  seoJson: json('seo_json'),
}, (t) => [index('page_versions_page_idx').on(t.pageId, t.versionKind)]);

export const pageBlocks = mysqlTable('page_blocks', {
  id: varchar('id', { length: 64 }).primaryKey(),
  pageVersionId: varchar('page_version_id', { length: 64 }).notNull(),
  type: varchar('type', { length: 60 }).notNull(),
  label: varchar('label', { length: 200 }),
  order: int('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  payload: json('payload').notNull(),
}, (t) => [index('page_blocks_version_idx').on(t.pageVersionId)]);

export const carousels = mysqlTable('carousels', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  placement: varchar('placement', { length: 200 }).notNull(),
  autoAdvanceMs: int('auto_advance_ms').notNull().default(6000),
});

export const carouselSlides = mysqlTable('carousel_slides', {
  id: varchar('id', { length: 64 }).primaryKey(),
  carouselId: varchar('carousel_id', { length: 64 }).notNull(),
  versionKind: mysqlEnum('version_kind', ['published', 'draft']).notNull(),
  src: varchar('src', { length: 500 }).notNull(),
  mobileSrc: varchar('mobile_src', { length: 500 }),
  title: varchar('title', { length: 300 }),
  subtitle: varchar('subtitle', { length: 300 }),
  caption: varchar('caption', { length: 300 }),
  chapterRef: varchar('chapter_ref', { length: 120 }),
  alt: varchar('alt', { length: 300 }).notNull(),
  objectPosition: varchar('object_position', { length: 40 }),
  order: int('order').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
}, (t) => [index('carousel_slides_carousel_idx').on(t.carouselId, t.versionKind)]);

export const scriptureChapters = mysqlTable('scripture_chapters', {
  chapterNumber: int('chapter_number').primaryKey(),
  titleEn: varchar('title_en', { length: 300 }).notNull(),
  titleSanskrit: varchar('title_sanskrit', { length: 300 }).notNull(),
  titleHi: varchar('title_hi', { length: 300 }),
  titleTe: varchar('title_te', { length: 300 }),
  summaryEn: text('summary_en').notNull(),
  summaryHi: text('summary_hi'),
  summaryTe: text('summary_te'),
  keyTeaching: text('key_teaching').notNull(),
  featuredVerseRef: varchar('featured_verse_ref', { length: 120 }).notNull(),
  verseCount: int('verse_count').notNull(),
  audioUrl: varchar('audio_url', { length: 500 }),
  status: varchar('status', { length: 40 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const scriptureVerses = mysqlTable('scripture_verses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  chapterNumber: int('chapter_number').notNull(),
  verseNumber: int('verse_number').notNull(),
  sanskritDevanagari: text('sanskrit_devanagari').notNull(),
  transliteration: text('transliteration').notNull(),
  translationEn: text('translation_en').notNull(),
  translationHi: text('translation_hi'),
  translationTe: text('translation_te'),
  commentaryNote: text('commentary_note'),
  audioUrl: varchar('audio_url', { length: 500 }),
  status: varchar('status', { length: 40 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('scripture_verses_chapter_verse_idx').on(t.chapterNumber, t.verseNumber)]);

export const storyScenes = mysqlTable('story_scenes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sceneNumber: int('scene_number').notNull(),
  titleEn: varchar('title_en', { length: 300 }),
  titleHi: varchar('title_hi', { length: 300 }),
  titleTe: varchar('title_te', { length: 300 }),
  chapterTag: varchar('chapter_tag', { length: 120 }),
  dialogueEn: text('dialogue_en'),
  dialogueHi: text('dialogue_hi'),
  dialogueTe: text('dialogue_te'),
  narrationEn: text('narration_en'),
  narrationHi: text('narration_hi'),
  narrationTe: text('narration_te'),
  primaryImageUrl: varchar('primary_image_url', { length: 500 }),
  audioUrl: varchar('audio_url', { length: 500 }),
  status: varchar('status', { length: 40 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('story_scenes_scene_number_idx').on(t.sceneNumber)]);

export const collections = mysqlTable('collections', {
  id: varchar('id', { length: 64 }).primaryKey(),
  kind: varchar('kind', { length: 40 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  subtitle: varchar('subtitle', { length: 300 }),
  description: text('description'),
  dateLabel: varchar('date_label', { length: 120 }),
  locationLabel: varchar('location_label', { length: 200 }),
  badgeLabel: varchar('badge_label', { length: 120 }),
  href: varchar('href', { length: 500 }),
  imageUrl: varchar('image_url', { length: 500 }),
  language: varchar('language', { length: 10 }).notNull(),
  order: int('order').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  status: varchar('status', { length: 40 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [index('collections_kind_idx').on(t.kind)]);

export const collectionMeta = mysqlTable('collection_meta', {
  id: int('id').autoincrement().primaryKey(),
  collectionId: varchar('collection_id', { length: 64 }).notNull(),
  metaKey: varchar('meta_key', { length: 80 }).notNull(),
  metaValue: text('meta_value'),
}, (t) => [index('collection_meta_collection_idx').on(t.collectionId)]);

export const cmsItems = mysqlTable('cms_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  section: varchar('section', { length: 60 }).notNull(),
  title: varchar('title', { length: 300 }),
  subtitle: varchar('subtitle', { length: 300 }),
  body: text('body'),
  language: varchar('language', { length: 10 }).notNull(),
  status: varchar('status', { length: 40 }).notNull(),
  meta: json('meta'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const revisions = mysqlTable('revisions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: varchar('entity_id', { length: 64 }).notNull(),
  entityTitle: varchar('entity_title', { length: 300 }),
  action: varchar('action', { length: 40 }).notNull(),
  actorEmail: varchar('actor_email', { length: 255 }).notNull(),
  summary: text('summary'),
  snapshotJson: json('snapshot_json').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('revisions_entity_idx').on(t.entityType, t.entityId, t.createdAt)]);

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  actorEmail: varchar('actor_email', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 40 }).notNull(),
  action: varchar('action', { length: 80 }).notNull(),
  module: varchar('module', { length: 60 }).notNull(),
  targetId: varchar('target_id', { length: 120 }),
  summary: text('summary'),
}, (t) => [index('audit_logs_timestamp_idx').on(t.timestamp), index('audit_logs_actor_idx').on(t.actorEmail)]);

export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().default(1),
  registrationOpen: boolean('registration_open').notNull().default(true),
  requireVolunteerApproval: boolean('require_volunteer_approval').notNull().default(true),
  maintenanceBanner: text('maintenance_banner'),
  defaultVoiceGender: varchar('default_voice_gender', { length: 10 }).notNull().default('female'),
  backupRetentionDays: int('backup_retention_days').notNull().default(30),
});
