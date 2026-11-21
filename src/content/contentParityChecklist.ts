export interface ContentParityItem {
  id: string;
  sectionGroup: string;
  officialSourceElement: string;
  localImplementation: string;
  route: string;
  verificationStatus: 'verified' | 'awaiting-verification';
  notes: string;
}

export const CONTENT_PARITY_CHECKLIST: ReadonlyArray<ContentParityItem> = [
  {
    id: 'parity-event-dates',
    sectionGroup: 'Milestones',
    officialSourceElement: '20 Dec 2026 Curtain Raiser (Vishwa Ahvanam) & 27 Feb 2027 Main Mahotsav',
    localImplementation: 'Hero, EventCountdown, ProgramPage, EventTimeline',
    route: '/program',
    verificationStatus: 'verified',
    notes: 'Anchored to IST (UTC+05:30) with exact online & Hyderabad format details.',
  },
  {
    id: 'parity-18-pillars',
    sectionGroup: 'Scale & Mission',
    officialSourceElement: '18 Countries · 18 Chapters · 18 Languages · 50,000+ Participants statement',
    localImplementation: 'Hero, EventIntroduction, ChapterExplorer, GlobalJourney',
    route: '/global-journey',
    verificationStatus: 'verified',
    notes: 'Matches published portal figures with explicit disclaimer where sub-breakdowns await release.',
  },
  {
    id: 'parity-18-countries',
    sectionGroup: 'Global Journey',
    officialSourceElement: '18 Officially Listed Countries across 5 continents',
    localImplementation: 'PARTICIPATING_COUNTRIES (Atlas & Interactive 3D Earth)',
    route: '/global-journey',
    verificationStatus: 'verified',
    notes: 'Strictly restricted to the 18 named nations from the official website.',
  },
  {
    id: 'parity-18-chapters',
    sectionGroup: 'Bhagavad Gita',
    officialSourceElement: 'All 18 Chapters, 700 Shlokas & Canonical Selected Verses (BG 2.47, 4.7, 6.5, 18.66)',
    localImplementation: 'GitaChapterCatalog, SacredGitaBook3D, ChapterExplorer, WhyParticipateSection',
    route: '/gita',
    verificationStatus: 'verified',
    notes: 'Zero invented quotes; includes Sanskrit Devanagari, IAST, Telugu, Hindi, and English.',
  },
  {
    id: 'parity-10-pathways',
    sectionGroup: 'Participation',
    officialSourceElement: 'All 10 Movement Pathways (Individual, Family, Group, Institutional, Youth 15–35, Global, Volunteer, Host Parayana, Partner, Support)',
    localImplementation: 'BePartOfGlobalMovementSection & ParticipationHubPage',
    route: '/participate',
    verificationStatus: 'verified',
    notes: 'Contextual registration links and live Volunteer Seva submission persisted to Secretariat.',
  },
  {
    id: 'parity-organizers-committee',
    sectionGroup: 'Leadership & Organizers',
    officialSourceElement: 'Aishwarya Sarvahith Foundation (ASF), Sree Media & 5 Named Organising Committee Profiles',
    localImplementation: 'LeadershipPage, PartnersPage, Footer, AboutPage',
    route: '/leadership',
    verificationStatus: 'verified',
    notes: 'Includes Godawarthy Sasidhar, Daitha Susheel Kumar, Vemuri Shravani, Pyreddy Krishna Reddy, K. Satya Prasad.',
  },
  {
    id: 'parity-secretariat-contact',
    sectionGroup: 'Contact & Secretariat',
    officialSourceElement: 'Khairatabad Hyderabad Address, +91 73967 56590 / +91 73311 76156, Sasi8372@gmail.com, divineauraworld9@gmail.com',
    localImplementation: 'ContactFaqPage, InstitutionalNoticeModal, Footer',
    route: '/contact',
    verificationStatus: 'verified',
    notes: 'All telephone, email, and social URLs verified against bhagavadgitavishwamahotsav.com.',
  },
  {
    id: 'parity-governance-policies',
    sectionGroup: 'Governance',
    officialSourceElement: 'Privacy Policy, Terms & Conditions, Refund & Cancellation Policy (Version 2026-11-05) & 4-day international hospitality term',
    localImplementation: 'PolicyPages, Registration Step 6 Consent, ParticipationHubPage',
    route: '/terms-conditions',
    verificationStatus: 'verified',
    notes: 'Mandatory consent before registration completion.',
  },
  {
    id: 'parity-registration-8-step',
    sectionGroup: 'Registration & Voice',
    officialSourceElement: 'Multilingual 8-step guided registration + optional voice assistant + real payment webhook status',
    localImplementation: 'RegistrationPage, RegistrationFormCard, VoiceRegistrationAssistant, CheckoutExperience',
    route: '/participate/register',
    verificationStatus: 'verified',
    notes: 'Zero auto-payment or unverified status fabrication; card/UPI handled strictly on gateway.',
  },
  {
    id: 'parity-external-dignitaries',
    sectionGroup: 'Awaiting Release',
    officialSourceElement: 'External Advisory Council, Spiritual Peetadhipatis, Keynote Speakers & Exact Hyderabad Complex Street Address',
    localImplementation: 'Structured reserve slots in LeadershipPage, PartnersPage, Timeline',
    route: '/leadership',
    verificationStatus: 'awaiting-verification',
    notes: 'Reserved cleanly without fabricating portraits, unapproved names, or synthetic timetables.',
  },
  {
    id: 'parity-live-gateway-creds',
    sectionGroup: 'Payment Gateway',
    officialSourceElement: 'Live Razorpay / Stripe merchant credentials & webhook HMAC secret',
    localImplementation: 'GET /api/payments/gateway-status & /api/public/payments/create-order',
    route: '/admin',
    verificationStatus: 'awaiting-verification',
    notes: 'Displays honest unconfigured state + external portal handoff until gateway secrets are supplied.',
  },
];
