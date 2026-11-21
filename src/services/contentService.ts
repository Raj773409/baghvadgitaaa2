import type {
  AnnouncementRecord,
  ChapterContentRecord,
  ContentRepository,
  CountryProgramRecord,
  EventRecord,
  FaqItem,
  LeadershipProfile,
  PartnerOrganization,
  ParticipationPathway,
  PolicyDocument,
  ScheduleItem,
  ScriptureVerseRecord,
} from '../types/cms';
import type { SupportedLocale } from '../utils/i18nHelpers';
import { PARTICIPATING_COUNTRIES } from '../content/countryContent';
import {
  OFFICIAL_ANNOUNCEMENTS,
  OFFICIAL_EVENTS_PROGRAM,
  OFFICIAL_SCHEDULE_LEDGER,
  VERIFIED_ORGANISING_COMMITTEE,
  VERIFIED_ORGANIZING_PARTNERS,
} from '../content/eventContent';
import { OFFICIAL_FAQS, OFFICIAL_POLICY_DOCUMENTS } from '../content/faqAndPolicyContent';
import { PARTICIPATION_PATHWAYS } from '../content/participationContent';
import { CANONICAL_GITA_VERSES, GITA_CHAPTER_CATALOG } from '../content/scriptureContent';
import { UI_DICTIONARIES } from '../i18n';

class StaticOfficialContentRepository implements ContentRepository {
  async getEvents(): Promise<ReadonlyArray<EventRecord>> {
    return OFFICIAL_EVENTS_PROGRAM;
  }

  async getScheduleItems(): Promise<ReadonlyArray<ScheduleItem>> {
    return OFFICIAL_SCHEDULE_LEDGER;
  }

  async getChapters(): Promise<ReadonlyArray<ChapterContentRecord>> {
    return GITA_CHAPTER_CATALOG;
  }

  async getScriptureVerses(): Promise<ReadonlyArray<ScriptureVerseRecord>> {
    return CANONICAL_GITA_VERSES;
  }

  async getCountries(): Promise<ReadonlyArray<CountryProgramRecord>> {
    return PARTICIPATING_COUNTRIES.map((country) => ({
      ...country,
      status: 'confirmed' as const,
    }));
  }

  async getLeadershipProfiles(): Promise<ReadonlyArray<LeadershipProfile>> {
    return VERIFIED_ORGANISING_COMMITTEE;
  }

  async getPartners(): Promise<ReadonlyArray<PartnerOrganization>> {
    return VERIFIED_ORGANIZING_PARTNERS;
  }

  async getAnnouncements(): Promise<ReadonlyArray<AnnouncementRecord>> {
    return OFFICIAL_ANNOUNCEMENTS;
  }

  async getFaqs(): Promise<ReadonlyArray<FaqItem>> {
    return OFFICIAL_FAQS;
  }

  async getPolicyDocument(id: PolicyDocument['id']): Promise<PolicyDocument> {
    return OFFICIAL_POLICY_DOCUMENTS[id];
  }

  async getParticipationPathways(): Promise<ReadonlyArray<ParticipationPathway>> {
    return PARTICIPATION_PATHWAYS;
  }

  async getTranslations(locale: SupportedLocale): Promise<Record<string, unknown>> {
    return UI_DICTIONARIES[locale] ?? UI_DICTIONARIES.en;
  }
}

export const contentRepository: ContentRepository = new StaticOfficialContentRepository();
