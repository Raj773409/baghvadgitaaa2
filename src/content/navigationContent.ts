export type MoreMenuIconId =
  | 'home'
  | 'compass'
  | 'book-open'
  | 'globe'
  | 'flame'
  | 'calendar'
  | 'users'
  | 'image'
  | 'award'
  | 'building'
  | 'mail'
  | 'shield';

export interface MoreMenuItem {
  id: string;
  to: string;
  icon: MoreMenuIconId;
  titleKey: string;
  subtitleKey: string;
  section: 'discover' | 'experience' | 'organization';
}

export const MORE_MENU_ITEMS: ReadonlyArray<MoreMenuItem> = [
  // GROUP 1 — DISCOVER
  {
    id: 'home',
    to: '/',
    icon: 'home',
    titleKey: 'navigationOverlay.items.homeTitle',
    subtitleKey: 'navigationOverlay.items.homeDesc',
    section: 'discover',
  },
  {
    id: 'about',
    to: '/about',
    icon: 'compass',
    titleKey: 'navigationOverlay.items.aboutTitle',
    subtitleKey: 'navigationOverlay.items.aboutDesc',
    section: 'discover',
  },
  {
    id: 'gita',
    to: '/gita',
    icon: 'book-open',
    titleKey: 'navigationOverlay.items.gitaTitle',
    subtitleKey: 'navigationOverlay.items.gitaDesc',
    section: 'discover',
  },
  {
    id: 'global-journey',
    to: '/global-journey',
    icon: 'globe',
    titleKey: 'navigationOverlay.items.globalTitle',
    subtitleKey: 'navigationOverlay.items.globalDesc',
    section: 'discover',
  },
  {
    id: 'story',
    to: '/story',
    icon: 'flame',
    titleKey: 'navigationOverlay.items.storyTitle',
    subtitleKey: 'navigationOverlay.items.storyDesc',
    section: 'discover',
  },

  // GROUP 2 — EXPERIENCE
  {
    id: 'program',
    to: '/program',
    icon: 'calendar',
    titleKey: 'navigationOverlay.items.programTitle',
    subtitleKey: 'navigationOverlay.items.programDesc',
    section: 'experience',
  },
  {
    id: 'participate',
    to: '/participate',
    icon: 'users',
    titleKey: 'navigationOverlay.items.participateTitle',
    subtitleKey: 'navigationOverlay.items.participateDesc',
    section: 'experience',
  },
  {
    id: 'media',
    to: '/media',
    icon: 'image',
    titleKey: 'navigationOverlay.items.mediaTitle',
    subtitleKey: 'navigationOverlay.items.mediaDesc',
    section: 'experience',
  },

  // GROUP 3 — ORGANIZATION
  {
    id: 'leadership',
    to: '/leadership',
    icon: 'award',
    titleKey: 'navigationOverlay.items.leadershipTitle',
    subtitleKey: 'navigationOverlay.items.leadershipDesc',
    section: 'organization',
  },
  {
    id: 'partners',
    to: '/partners',
    icon: 'building',
    titleKey: 'navigationOverlay.items.partnersTitle',
    subtitleKey: 'navigationOverlay.items.partnersDesc',
    section: 'organization',
  },
  {
    id: 'contact',
    to: '/contact',
    icon: 'mail',
    titleKey: 'navigationOverlay.items.contactTitle',
    subtitleKey: 'navigationOverlay.items.contactDesc',
    section: 'organization',
  },
  {
    id: 'policies',
    to: '/privacy-policy',
    icon: 'shield',
    titleKey: 'navigationOverlay.items.policiesTitle',
    subtitleKey: 'navigationOverlay.items.policiesDesc',
    section: 'organization',
  },
];

export const HERO_PROGRESS_SECTIONS: ReadonlyArray<{
  id: string;
  labelKey: string;
  tone: 'dark' | 'light';
}> = [
  { id: 'top', labelKey: 'hero.railHero', tone: 'dark' },
  { id: 'mahotsav', labelKey: 'hero.railScale', tone: 'light' },
  { id: 'eternal-message', labelKey: 'hero.railIntro', tone: 'dark' },
  { id: 'chapters', labelKey: 'hero.railChapters', tone: 'dark' },
  { id: 'global-journey', labelKey: 'hero.railGlobal', tone: 'dark' },
  { id: 'timeline', labelKey: 'hero.railTimeline', tone: 'light' },
  { id: 'leadership', labelKey: 'sitemap.leadership', tone: 'light' },
  { id: 'partners', labelKey: 'sitemap.partners', tone: 'dark' },
  { id: 'media', labelKey: 'sitemap.media', tone: 'light' },
  { id: 'participation', labelKey: 'hero.railParticipate', tone: 'light' },
];

export const SITEMAP_EXPANSION_LINKS: ReadonlyArray<{
  id: string;
  href: string;
  labelKey: string;
}> = [
  { id: 'about', href: '/about', labelKey: 'sitemap.about' },
  { id: 'gita', href: '/gita', labelKey: 'sitemap.chapters' },
  { id: 'story', href: '/story', labelKey: 'sitemap.story' },
  { id: 'journey', href: '/global-journey', labelKey: 'sitemap.globalJourney' },
  { id: 'events', href: '/program', labelKey: 'sitemap.events' },
  { id: 'participate', href: '/participate', labelKey: 'sitemap.participate' },
  { id: 'leadership', href: '/leadership', labelKey: 'sitemap.leadership' },
  { id: 'partners', href: '/partners', labelKey: 'sitemap.partners' },
  { id: 'media', href: '/media', labelKey: 'sitemap.media' },
  { id: 'contact', href: '/contact', labelKey: 'sitemap.contact' },
  { id: 'faqs', href: '/faqs', labelKey: 'sitemap.faqs' },
];
