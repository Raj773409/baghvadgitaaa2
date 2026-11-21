import type { SupportedLocale } from '../utils/i18nHelpers';

export type ApprovalStatus =
  | 'confirmed'
  | 'upcoming'
  | 'pending-organizer-approval'
  | 'canonical-reference';

export interface LocalizedText {
  en: string;
  hi: string;
  te: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  isoDate: string;
  dateDisplay: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  category: 'milestone' | 'parayana' | 'youth' | 'cultural' | 'global-connect';
  format: 'online' | 'in-person' | 'hybrid';
  location: LocalizedText | null;
  scheduleTime: string | null;
  status: ApprovalStatus;
  highlights: LocalizedText[];
}

export interface ScheduleItem {
  id: string;
  eventId: string;
  isoDate: string;
  timeSlot: string | null;
  title: LocalizedText;
  venue: LocalizedText | null;
  status: ApprovalStatus;
}

export interface ChapterContentRecord {
  chapterNumber: number;
  romanNumeral: string;
  paddedCode: string;
  verseCount: number;
  sanskritDevanagari: string;
  transliteration: string;
  title: LocalizedText;
  essence: LocalizedText;
  organizerDossierStatus: ApprovalStatus;
  approvedAudioUrl: string | null;
}

export interface ScriptureVerseRecord {
  id: string;
  chapter: number;
  verse: number;
  reference: string;
  theme: LocalizedText;
  sanskritDevanagari: string;
  transliteration: string;
  translationEn: string;
  meaningHi: string;
  meaningTe: string;
  sourceAttribution: LocalizedText;
  editorialStatus: ApprovalStatus;
  commentarySlot: LocalizedText | null;
  audioRecitationUrl: string | null;
}

export interface CountryProgramRecord {
  id: string;
  code: string;
  nameKey: string;
  regionKey: string;
  lat: number;
  lon: number;
  status: ApprovalStatus;
  approvedSummaryKey: string | null;
}

export interface LeadershipProfile {
  id: string;
  category: 'organizing-committee' | 'organizing-body' | 'advisory' | 'spiritual' | 'dignitary' | 'speaker';
  roleLabel: string;
  name: string;
  designation: string;
  bio: string;
  portraitSrc: string | null;
  status: ApprovalStatus;
  sourcePortalPath: string;
}

export interface PartnerOrganization {
  id: string;
  name: string;
  tier: 'institutional' | 'cultural' | 'academic' | 'media';
  logoSrc: string | null;
  websiteUrl: string | null;
  status: ApprovalStatus;
}

export interface MediaAssetRecord {
  id: string;
  category: 'photographs' | 'videos' | 'press' | 'announcements';
  titleKey: string;
  captionKey: string;
  dateLabelKey: string;
  imageId: string | null;
  aspectRatio: '16:9' | '4:3';
  status: 'visual-study' | 'approved-official' | 'pending-organizer-approval';
}

export interface AnnouncementRecord {
  id: string;
  isoDate: string;
  title: LocalizedText;
  summary: LocalizedText;
  status: ApprovalStatus;
}

export interface FaqItem {
  id: string;
  category: 'general' | 'participation' | 'curtain-raiser' | 'travel' | 'governance';
  question: LocalizedText;
  answer: LocalizedText;
}

export interface PolicySection {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  bullets?: LocalizedText[];
}

export interface PolicyDocument {
  id: 'privacy' | 'terms' | 'refund';
  route: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  effectiveDate: string;
  version: string;
  governingEntity: string;
  sections: PolicySection[];
}

export interface ParticipationPathway {
  id: string;
  registrationType: 'individual' | 'family' | 'volunteer' | 'scholar' | 'youth' | 'institutional' | 'foreigner';
  title: LocalizedText;
  audience: LocalizedText;
  description: LocalizedText;
  eligibility: LocalizedText;
}

export interface AdminUserSession {
  userId: string;
  email: string;
  role: 'super-admin' | 'content-editor' | 'reviewer';
  authenticatedAt: string;
}

/**
 * Future-ready Admin Authentication contract.
 * Implementations must verify sessions server-side via JWT/OAuth/Firebase Auth;
 * never store admin credentials or mock unlock state in client storage.
 */
export interface AdminAuthService {
  getSession(): Promise<AdminUserSession | null>;
  requireRole(role: AdminUserSession['role']): Promise<boolean>;
  signOut(): Promise<void>;
}

/**
 * Abstract Repository Architecture allowing drop-in replacement from verified
 * static records to a headless CMS, Firestore, or REST/GraphQL backend.
 */
export interface ContentRepository {
  getEvents(): Promise<ReadonlyArray<EventRecord>>;
  getScheduleItems(): Promise<ReadonlyArray<ScheduleItem>>;
  getChapters(): Promise<ReadonlyArray<ChapterContentRecord>>;
  getScriptureVerses(): Promise<ReadonlyArray<ScriptureVerseRecord>>;
  getCountries(): Promise<ReadonlyArray<CountryProgramRecord>>;
  getLeadershipProfiles(): Promise<ReadonlyArray<LeadershipProfile>>;
  getPartners(): Promise<ReadonlyArray<PartnerOrganization>>;
  getAnnouncements(): Promise<ReadonlyArray<AnnouncementRecord>>;
  getFaqs(): Promise<ReadonlyArray<FaqItem>>;
  getPolicyDocument(id: PolicyDocument['id']): Promise<PolicyDocument>;
  getParticipationPathways(): Promise<ReadonlyArray<ParticipationPathway>>;
  getTranslations(locale: SupportedLocale): Promise<Record<string, unknown>>;
}
