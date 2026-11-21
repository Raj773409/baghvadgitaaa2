import type { AnnouncementRecord, EventRecord, LeadershipProfile, PartnerOrganization, ScheduleItem } from '../types/cms';

export const OFFICIAL_EVENT_URLS = {
  home: 'https://bhagavadgitavishwamahotsav.com/',
  register: 'https://bhagavadgitavishwamahotsav.com/participate/register',
  instagram: 'https://instagram.com/bhagavad_gita_vishwa_mahotsav',
  facebook: 'https://facebook.com/BhagavadGitaVishwaMahotsav',
  twitter: 'https://x.com/gita_event',
  youtube: 'https://youtube.com/@bhagavadgitavishwamahotsav',
} as const;

export const OFFICIAL_SECRETARIAT_CONTACT = {
  foundationName: 'Aishwarya Sarvahith Foundation (ASF)',
  broadcastPartner: 'Sree Media',
  address:
    'P. No. 3, 4, 5, 6, Sy. No. 14, Eureka Court, Y R Guda, Srinagar Colony, Khairatabad, Hyderabad – 500073, Telangana, India',
  phones: [
    { number: '+91 73967 56590', telHref: 'tel:+917396756590', label: 'Primary Desk' },
    { number: '+91 73311 76156', telHref: 'tel:+917331176156', label: 'Secretariat (Sec)' },
  ],
  emails: [
    { address: 'Sasi8372@gmail.com', mailtoHref: 'mailto:Sasi8372@gmail.com', label: 'Event Head' },
    {
      address: 'divineauraworld9@gmail.com',
      mailtoHref: 'mailto:divineauraworld9@gmail.com',
      label: 'Secretariat (Sec)',
    },
  ],
} as const;

export interface EventMilestone {
  id: 'curtain-raiser' | 'main-mahotsav';
  isoDate: string;
  labelKey: string;
  titleKey: string;
  descriptionKey: string;
  venueApproved: string | null;
  timeApproved: string | null;
}

export const PUBLISHED_MILESTONES: ReadonlyArray<EventMilestone> = [
  {
    id: 'curtain-raiser',
    isoDate: '2026-12-20',
    labelKey: 'timeline.curtainRaiserDate',
    titleKey: 'timeline.curtainRaiserTitle',
    descriptionKey: 'timeline.curtainRaiserDesc',
    venueApproved: 'Online Global Convocation (Vishwa Ahvanam)',
    timeApproved: null,
  },
  {
    id: 'main-mahotsav',
    isoDate: '2027-02-27',
    labelKey: 'timeline.mainMahotsavDate',
    titleKey: 'timeline.mainMahotsavTitle',
    descriptionKey: 'timeline.mainMahotsavDesc',
    venueApproved: 'Hyderabad, Telangana, India (Exact Venue Pending Organizer Notice)',
    timeApproved: null,
  },
];

export const OFFICIAL_EVENTS_PROGRAM: ReadonlyArray<EventRecord> = [
  {
    id: 'curtain-raiser',
    slug: 'curtain-raiser',
    isoDate: '2026-12-20',
    dateDisplay: {
      en: '20 December 2026',
      hi: '20 दिसम्बर 2026',
      te: '20 డిసెంబర్ 2026',
    },
    title: {
      en: 'Bhagavadgita Vishwa Ahvanam — Curtain Raiser',
      hi: 'भगवद्गीता विश्व आह्वानम् — कर्टेन रेज़र',
      te: 'భగవద్గీత విశ్వ ఆహ్వానమ్ — కర్టెన్ రైజర్',
    },
    subtitle: {
      en: 'Synchronized Global Online Initiation',
      hi: 'वैश्विक ऑनलाइन उद्घाटन आह्वान',
      te: 'అంతర్జాతీయ ఆన్‌లైన్ ప్రారంభ వేడుక',
    },
    description: {
      en: 'Registered international participants recite six designated Bhagavad Gita shlokas in both their mother tongue and Sanskrit, initiating the eighteen-country journey toward Hyderabad 2027.',
      hi: 'पंजीकृत अंतर्राष्ट्रीय प्रतिभागी अपनी मातृभाषा और संस्कृत दोनों में छह निर्धारित श्लोकों का ऑनलाइन पाठ कर हैदराबाद २०२७ की विश्व यात्रा का शुभारंभ करते हैं।',
      te: 'నమోదు చేసుకున్న అంతర్జాతీయ ప్రతినిధులు తమ మాతృభాష మరియు సంస్కృతంలో ఆరు నిర్దేశిత శ్లోకాలను పఠించి 2027 మహోత్సవానికి శ్రీకారం చుడతారు.',
    },
    category: 'milestone',
    format: 'online',
    location: {
      en: 'Global Online Portal (All 18 Countries)',
      hi: 'वैश्विक ऑनलाइन मंच (सभी १८ देश)',
      te: 'అంతర్జాతీయ ఆన్‌లైన్ వేదిక (18 దేశాలు)',
    },
    scheduleTime: null,
    status: 'confirmed',
    highlights: [
      {
        en: 'Recitation of 6 designated shlokas in mother tongue and Sanskrit',
        hi: 'मातृभाषा एवं संस्कृत में ६ निर्धारित श्लोकों का पाठ',
        te: 'మాతృభాష మరియు సంస్కృతంలో 6 నిర్దేశిత శ్లోకాల పారాయణం',
      },
      {
        en: 'Open to registered individuals, youth, families, and institutions worldwide',
        hi: 'विश्वभर के पंजीकृत व्यक्तियों, युवाओं, परिवारों व संस्थानों के लिए खुला',
        te: 'ప్రపంచవ్యాప్తంగా నమోదైన వ్యక్తులు, యువత, కుటుంబాలు మరియు సంస్థలకు అవకాశం',
      },
    ],
  },
  {
    id: 'main-mahotsav',
    slug: 'main-mahotsav',
    isoDate: '2027-02-27',
    dateDisplay: {
      en: '27 February 2027',
      hi: '27 फरवरी 2027',
      te: '27 ఫిబ్రవరి 2027',
    },
    title: {
      en: 'Bhagavad Gita Vishwa Mahotsav 2027',
      hi: 'भगवद्गीता विश्व महोत्सव 2027',
      te: 'భగవద్గీత విశ్వ మహోత్సవం 2027',
    },
    subtitle: {
      en: 'Principal Global Convocation in Hyderabad',
      hi: 'हैदराबाद में मुख्य अंतर्राष्ट्रीय महासम्मेलन',
      te: 'హైదరాబాద్‌లో ప్రధాన అంతర్జాతీయ మహాసమ్మేళనం',
    },
    description: {
      en: 'Culminating live international stage gathering in Hyderabad where selected delegates from eighteen countries unite for collective recitation, scholarly dialogue, and the launch of long-term legacy initiatives.',
      hi: 'हैदराबाद में होने वाला मुख्य अंतर्राष्ट्रीय समारोह जहाँ १८ देशों के चयनित प्रतिनिधि सामूहिक गीता पाठ, विद्वत् संवाद और दीर्घकालिक प्रकल्पों के शुभारंभ हेतु एकत्रित होंगे।',
      te: '18 దేశాల నుండి ఎంపికైన ప్రతినిధులు హైదరాబాద్ వేదికపై సామూహిక శ్లోక పారాయణం, విద్వత్ సంవాదం మరియు భవిష్యత్తు కార్యక్రమాల ప్రారంభోత్సవంలో పాల్గొంటారు.',
    },
    category: 'milestone',
    format: 'in-person',
    location: {
      en: 'Hyderabad, Telangana, India (Specific Venue Pending Release)',
      hi: 'हैदराबाद, तेलंगाना, भारत (सटीक स्थल की घोषणा प्रतीक्षित)',
      te: 'హైదరాబాద్, తెలంగాణ, భారతదేశం (ప్రత్యేక వేదిక వివరాలు త్వరలో)',
    },
    scheduleTime: null,
    status: 'confirmed',
    highlights: [
      {
        en: 'Live stage recitation of selected shlokas in mother tongue & Sanskrit',
        hi: 'मातृभाषा एवं संस्कृत में मुख्य मंच पर श्लोक पाठ',
        te: 'ప్రధాన వేదికపై మాతృభాష మరియు సంస్కృతంలో శ్లోక పఠనం',
      },
      {
        en: 'Launch of permanent Bhagavad Gita Vishwa Diwas legacy resolutions',
        hi: 'वार्षिक भगवद्गीता विश्व दिवस सहित स्थायी प्रकल्पों का शुभारंभ',
        te: 'భగవద్గీత విశ్వ దివస్ వంటి శాశ్వత కార్యక్రమాల ఆవిష్కరణ',
      },
    ],
  },
  {
    id: 'grand-parayana',
    slug: 'grand-parayana',
    isoDate: '2027-02-27',
    dateDisplay: {
      en: '27 February 2027 (Published Programme Track)',
      hi: '27 फरवरी 2027 (प्रकाशित कार्यक्रम)',
      te: '27 ఫిబ్రవరి 2027 (ప్రకటిత కార్యక్రమం)',
    },
    title: {
      en: 'Grand Parayana — Collective Sacred Recitation',
      hi: 'महापारायण — सामूहिक गीता पाठ',
      te: 'మహా పారాయణమ్ — సామూహిక గీతా పఠనం',
    },
    subtitle: {
      en: 'Synchronized Eighteen-Chapter Resonance',
      hi: 'अठारह अध्यायों का सामूहिक स्वर',
      te: 'అష్టాదశ అధ్యాయాల సామూహిక పారాయణం',
    },
    description: {
      en: 'Flagship mass recitation uniting thousands of voices across communities, institutions, and participating nations in shared reverence for the eighteen chapters.',
      hi: 'सभी समुदायों, शिक्षण संस्थानों और सहभागी देशों के स्वरों को एक सूत्र में पिरोने वाला भव्य सामूहिक गीता पारायण।',
      te: 'వివిధ దేశాలు, విద్యాసంస్థలు మరియు సమూహాల నుండి వేలాది గొంతులు ఏకమై పఠించే మహా సామూహిక పారాయణం.',
    },
    category: 'parayana',
    format: 'hybrid',
    location: {
      en: 'Hyderabad Main Precinct & Linked International Chapters',
      hi: 'हैदराबाद मुख्य स्थल एवं संबद्ध अंतर्राष्ट्रीय केंद्र',
      te: 'హైదరాబాద్ ప్రధాన వేదిక మరియు అనుబంధ అంతర్జాతీయ కేంద్రాలు',
    },
    scheduleTime: null,
    status: 'upcoming',
    highlights: [
      {
        en: 'Exact session timings awaiting final organizer timetable sign-off',
        hi: 'सटीक समय-सारणी आयोजकों की अंतिम स्वीकृति के पश्चात् प्रकाशित होगी',
        te: 'ఖచ్చితమైన సమయ వివరాలు నిర్వాహకుల తుది ఆమోదం తర్వాత ప్రకటించబడతాయి',
      },
    ],
  },
  {
    id: 'youth-gita',
    slug: 'youth-gita',
    isoDate: '2027-02-25',
    dateDisplay: {
      en: 'Feb 2027 Convocation Window (25 Feb Listed on Portal)',
      hi: 'फरवरी 2027 (पोर्टल पर 25 फरवरी सूचीबद्ध)',
      te: 'ఫిబ్రవరి 2027 (పోర్టల్‌లో 25 ఫిబ్రవరి)',
    },
    title: {
      en: 'Youth Gita Forum (Ages 15–35)',
      hi: 'युवा गीता मंच (आयु १५–३५ वर्ष)',
      te: 'యువ గీత వేదిక (వయస్సు 15–35 ఏళ్లు)',
    },
    subtitle: {
      en: 'Clarity, Purpose & Leadership for the Next Generation',
      hi: 'नई पीढ़ी के लिए स्पष्टता, उद्देश्य और नेतृत्व संवाद',
      te: 'యువత కోసం స్పష్టత, లక్ష్యసిద్ధి మరియు నాయకత్వ సంవాదం',
    },
    description: {
      en: 'Dedicated programme track for young thinkers, students, and emerging leaders exploring clarity of mind, ethical decision-making, and selfless service.',
      hi: 'विद्यार्थियों और युवा नेतृत्व के लिए मन की एकाग्रता, नैतिक निर्णय और सेवा भाव पर केंद्रित विशेष सत्र।',
      te: 'విద్యార్థులు మరియు యువ నాయకులకు మనోనిగ్రహం, నైతిక విలువలు మరియు సేవాభావంపై ప్రత్యేక సదస్సు.',
    },
    category: 'youth',
    format: 'in-person',
    location: null,
    scheduleTime: null,
    status: 'pending-organizer-approval',
    highlights: [
      {
        en: 'Curriculum and campus partner roster awaiting final confirmation',
        hi: 'सत्र रूपरेखा एवं विश्वविद्यालय सहभागिता अंतिम पुष्टि हेतु प्रतीक्षारत',
        te: 'కార్యక్రమ వివరాలు మరియు విశ్వవిద్యాలయ భాగస్వామ్యం తుది నిర్ధారణలో ఉన్నాయి',
      },
    ],
  },
  {
    id: 'cultural-programme',
    slug: 'cultural-programme',
    isoDate: '2027-02-25',
    dateDisplay: {
      en: 'Feb 2027 Convocation Window (25 Feb Listed on Portal)',
      hi: 'फरवरी 2027 (पोर्टल पर 25 फरवरी सूचीबद्ध)',
      te: 'ఫిబ్రవరి 2027 (పోర్టల్‌లో 25 ఫిబ్రవరి)',
    },
    title: {
      en: 'Classical Arts & Cultural Programme',
      hi: 'शास्त्रीय कला एवं सांस्कृतिक उत्सव',
      te: 'శాస్త్రీయ కళలు మరియు సాంస్కృతిక కార్యక్రమం',
    },
    subtitle: {
      en: 'Music, Dance & Living Heritage Inspired by Kurukshetra',
      hi: 'संगीत, नृत्य और सजीव सांस्कृतिक अभिव्यक्ति',
      te: 'సంగీతం, నృత్యం మరియు సజీవ సాంస్కృతిక ప్రదర్శనలు',
    },
    description: {
      en: 'Curated classical music, dance drama, and sculptural exhibitions presenting philosophical themes through India’s living artistic traditions.',
      hi: 'भारतीय शास्त्रीय संगीत, नृत्य-नाटिका और कला प्रदर्शनियों के माध्यम से गीता के दार्शनिक भावों की प्रस्तुति।',
      te: 'శాస్త్రీయ సంగీతం, నృత్యరూపకాలు మరియు కళా ప్రదర్శనల ద్వారా గీతా సందేశ ఆవిష్కరణ.',
    },
    category: 'cultural',
    format: 'in-person',
    location: null,
    scheduleTime: null,
    status: 'pending-organizer-approval',
    highlights: [
      {
        en: 'Artist roster and performance schedule pending formal organizer approval',
        hi: 'कलाकारों की सूची और मंचन समय औपचारिक अनुमोदन की प्रतीक्षा में',
        te: 'కళాకారుల వివరాలు మరియు ప్రదర్శన సమయాలు అధికారిక ఆమోదం కోసం వేచి ఉన్నాయి',
      },
    ],
  },
  {
    id: 'global-connect',
    slug: 'global-connect',
    isoDate: '2027-02-26',
    dateDisplay: {
      en: 'Feb 2027 Convocation Window (26 Feb Listed on Portal)',
      hi: 'फरवरी 2027 (पोर्टल पर 26 फरवरी सूचीबद्ध)',
      te: 'ఫిబ్రవరి 2027 (పోర్టల్‌లో 26 ఫిబ్రవరి)',
    },
    title: {
      en: 'Global Connect — 18-Country Delegate Dialogue',
      hi: 'ग्लोबल कनेक्ट — १८-देशीय प्रतिनिधि संवाद',
      te: 'గ్లోబల్ కనెక్ట్ — 18 దేశాల ప్రతినిధుల సదస్సు',
    },
    subtitle: {
      en: 'Cross-Cultural Exchange Across Continents',
      hi: 'अंतर-सांस्कृतिक वैश्विक संवाद',
      te: 'ఖండాంతర సాంస్కృతిక మరియు తాత్విక సంవాదం',
    },
    description: {
      en: 'International delegates, translators, and cultural chapters across eighteen countries exchange perspectives on Gita scholarship in global languages.',
      hi: '१८ देशों के प्रतिनिधि, अनुवादक और सांस्कृतिक केंद्र विभिन्न भाषाओं में गीता चिंतन का आदान-प्रदान करेंगे।',
      te: '18 దేశాలకు చెందిన ప్రతినిధులు, అనువాదకులు మరియు సాంస్కృతిక కేంద్రాలు వివిధ భాషలలో గీతా తత్వంపై చర్చిస్తాయి.',
    },
    category: 'global-connect',
    format: 'hybrid',
    location: null,
    scheduleTime: null,
    status: 'pending-organizer-approval',
    highlights: [
      {
        en: 'International delegate itinerary and hospitality desks published via Secretariat',
        hi: 'अंतर्राष्ट्रीय अतिथि सत्कार एवं यात्रा विवरण सचिवालय द्वारा समन्वित',
        te: 'అంతర్జాతీయ ప్రతినిధుల వసతి మరియు కార్యక్రమ సమన్వయం సచివాలయం ద్వారా జరుగుతుంది',
      },
    ],
  },
];

export const OFFICIAL_SCHEDULE_LEDGER: ReadonlyArray<ScheduleItem> = [
  {
    id: 'sch-1',
    eventId: 'curtain-raiser',
    isoDate: '2026-12-20',
    timeSlot: null,
    title: {
      en: 'Vishwa Ahvanam — Online Opening & 6-Shloka Global Recitation',
      hi: 'विश्व आह्वानम् — ऑनलाइन उद्घाटन व ६-श्लोक वैश्विक पाठ',
      te: 'విశ్వ ఆహ్వానమ్ — ఆన్‌లైన్ ప్రారంభం & 6 శ్లోకాల విశ్వ పారాయణం',
    },
    venue: {
      en: 'Online Broadcast Across All 18 Countries',
      hi: 'सभी १८ देशों में ऑनलाइन प्रसारण',
      te: '18 దేశాలలో ఆన్‌లైన్ ప్రసారం',
    },
    status: 'confirmed',
  },
  {
    id: 'sch-2',
    eventId: 'main-mahotsav',
    isoDate: '2027-02-27',
    timeSlot: null,
    title: {
      en: 'Bhagavad Gita Vishwa Mahotsav — Main Stage Convocation & Grand Parayana',
      hi: 'भगवद्गीता विश्व महोत्सव — मुख्य समारोह एवं महापारायण',
      te: 'భగవద్గీత విశ్వ మహోత్సవం — ప్రధాన సభ మరియు మహా పారాయణమ్',
    },
    venue: {
      en: 'Hyderabad, Telangana, India (Exact Complex Awaiting Organizer Release)',
      hi: 'हैदराबाद, तेलंगाना, भारत (मुख्य परिसर विवरण प्रतीक्षित)',
      te: 'హైదరాబాద్, తెలంగాణ, భారతదేశం (ప్రధాన ప్రాంగణ వివరాలు త్వరలో)',
    },
    status: 'confirmed',
  },
  {
    id: 'sch-3',
    eventId: 'youth-gita',
    isoDate: '2027-02-25',
    timeSlot: null,
    title: {
      en: 'Youth Gita & Classical Cultural Sessions (Sub-track Timetable)',
      hi: 'युवा गीता एवं शास्त्रीय सांस्कृतिक सत्र (प्रस्तावित क्रम)',
      te: 'యువ గీత మరియు సాంస్కృతిక సదస్సులు (తాత్కాలిక షెడ్యూల్)',
    },
    venue: {
      en: 'Hyderabad Convocation Precinct',
      hi: 'हैदराबाद महासम्मेलन परिसर',
      te: 'హైదరాబాద్ మహోత్సవ ప్రాంగణం',
    },
    status: 'pending-organizer-approval',
  },
  {
    id: 'sch-4',
    eventId: 'global-connect',
    isoDate: '2027-02-26',
    timeSlot: null,
    title: {
      en: 'Global Connect — 18-Country Representative Colloquium',
      hi: 'ग्लोबल कनेक्ट — १८-देशीय प्रतिनिधि संगोष्ठी',
      te: 'గ్లోబల్ కనెక్ట్ — 18 దేశాల ప్రతినిధుల గోష్ఠి',
    },
    venue: {
      en: 'Hyderabad Convocation Precinct',
      hi: 'हैदराबाद महासम्मेलन परिसर',
      te: 'హైదరాబాద్ మహోత్సవ ప్రాంగణం',
    },
    status: 'pending-organizer-approval',
  },
];

export const OFFICIAL_ANNOUNCEMENTS: ReadonlyArray<AnnouncementRecord> = [
  {
    id: 'ann-policy-2026',
    isoDate: '2026-11-05',
    title: {
      en: 'Governance Charter & International Participation Guidelines Published',
      hi: 'गवर्नेंस चार्टर एवं अंतर्राष्ट्रीय सहभागिता दिशानिर्देश प्रकाशित',
      te: 'పరిపాలనా నియమావళి మరియు అంతర్జాతీయ భాగస్వామ్య మార్గదర్శకాలు విడుదల',
    },
    summary: {
      en: 'Aishwarya Sarvahith Foundation issued Version 2026-11-05 of the Terms & Conditions, Privacy Policy, and Refund & Cancellation Policy governing online Curtain Raiser (20 Dec 2026) and Hyderabad Main Mahotsav (27 Feb 2027).',
      hi: 'ऐश्वर्या सर्वहित फाउंडेशन ने २० दिसम्बर २०२६ (कर्टेन रेज़र) तथा २७ फरवरी २०२७ (हैदराबाद मुख्य महोत्सव) हेतु नियम व शर्तें, गोपनीयता और रिफंड नीति (संस्करण 2026-11-05) जारी की।',
      te: 'ఐశ్వర్య సర్వహిత ఫౌండేషన్ 20 డిసెంబర్ 2026 (కర్టెన్ రైజర్) మరియు 27 ఫిబ్రవరి 2027 (హైదరాబాద్ ప్రధాన మహోత్సవం) కోసం నియమ నిబంధనలు, గోప్యతా మరియు రీఫండ్ విధానాన్ని (2026-11-05) ప్రకటించింది.',
    },
    status: 'confirmed',
  },
  {
    id: 'ann-reg-open',
    isoDate: '2026-11-10',
    title: {
      en: 'Global Participant, Youth (15–35) & Institutional Registrations Active',
      hi: 'वैश्विक प्रतिभागी, युवा (१५–३५) और संस्थागत पंजीकरण सक्रिय',
      te: 'అంతర్జాతీయ ప్రతినిధులు, యువత (15–35) మరియు సంస్థల నమోదు ప్రారంభం',
    },
    summary: {
      en: 'Delegates across the 18 participating nations may submit registration details for Vishwa Ahvanam and Main Mahotsav 2027 through the official registration flow.',
      hi: '१८ सहभागी देशों के प्रतिनिधि विश्व आह्वानम् और मुख्य महोत्सव २०२७ के लिए आधिकारिक पंजीकरण प्रणाली के माध्यम से विवरण प्रस्तुत कर सकते हैं।',
      te: '18 దేశాలకు చెందిన ప్రతినిధులు విశ్వ ఆహ్వానమ్ మరియు ప్రధాన మహోత్సవం 2027 కోసం అధికారిక నమోదు పోర్టల్ ద్వారా దరఖాస్తు చేసుకోవచ్చు.',
    },
    status: 'confirmed',
  },
];

export const VERIFIED_ORGANISING_COMMITTEE: ReadonlyArray<LeadershipProfile> = [
  {
    id: 'godawarthy-sasidhar',
    category: 'organizing-committee',
    roleLabel: 'Senior Media Professional',
    name: 'Godawarthy Sasidhar',
    designation: 'Event Head · Senior Media Professional',
    bio: 'A senior media professional with leadership experience spanning more than 30 years across television, new media, programming, creative direction, content and marketing.',
    portraitSrc: null,
    status: 'confirmed',
    sourcePortalPath: 'https://bhagavadgitavishwamahotsav.com/about/organising-committee',
  },
  {
    id: 'daitha-susheel-kumar',
    category: 'organizing-committee',
    roleLabel: 'Communications & Marketing',
    name: 'Daitha Susheel Kumar',
    designation: 'Communications & Marketing · Healthcare Business Leader',
    bio: 'With 25 years of experience in healthcare sales, marketing, and business development, bringing expertise in strategic planning, communication, content creation, event designing, presentations, and administration.',
    portraitSrc: null,
    status: 'confirmed',
    sourcePortalPath: 'https://bhagavadgitavishwamahotsav.com/about/organising-committee',
  },
  {
    id: 'vemuri-shravani',
    category: 'organizing-committee',
    roleLabel: 'Content & Communications',
    name: 'Vemuri Shravani',
    designation: 'Content & Communications · Senior Anchor & Artist',
    bio: 'A senior media professional with 22 years of experience as a Senior Anchor and Artist, with an extensive body of work in devotional programming across leading television channels including Zee and Maa TV.',
    portraitSrc: null,
    status: 'confirmed',
    sourcePortalPath: 'https://bhagavadgitavishwamahotsav.com/about/organising-committee',
  },
  {
    id: 'pyreddy-krishna-reddy',
    category: 'organizing-committee',
    roleLabel: 'Concept & IP, Relationship Management',
    name: 'Pyreddy Krishna Reddy',
    designation: 'Concept & IP, Relationship Management · Entrepreneur',
    bio: 'An entrepreneur leading Propel Forge, with a professional background of over 14 years across business development, client relationships, creative thinking, and execution.',
    portraitSrc: null,
    status: 'confirmed',
    sourcePortalPath: 'https://bhagavadgitavishwamahotsav.com/about/organising-committee',
  },
  {
    id: 'k-satya-prasad-surya',
    category: 'organizing-committee',
    roleLabel: 'Business Leadership & Partnerships',
    name: 'K. Satya Prasad (Surya)',
    designation: 'Business Leadership & Partnerships · Diversified Entrepreneur',
    bio: 'Entrepreneur, infrastructure professional and business leader with a professional journey spanning infrastructure development, civil contracting, mining and crushing, digital media, creative studios, energy exploration, food ventures, technology-enabled services, and social welfare.',
    portraitSrc: null,
    status: 'confirmed',
    sourcePortalPath: 'https://bhagavadgitavishwamahotsav.com/about/organising-committee',
  },
];

export interface LeadershipRecord {
  id: string;
  category: 'organizing' | 'advisory' | 'spiritual' | 'dignitary' | 'speaker';
  name: string;
  designation: string;
  portraitSrc: string | null;
  approved: boolean;
}

export interface PartnerRecord {
  id: string;
  name: string;
  tier: 'institutional' | 'cultural' | 'academic';
  logoSrc: string | null;
  websiteUrl: string | null;
  approved: boolean;
}

/**
 * External Advisory Council, Spiritual Peetadhipatis, Dignitaries, and Keynote Speakers
 * remain strictly pending formal individual publication sign-off to prevent fabrication.
 */
export const APPROVED_LEADERSHIP_RECORDS: ReadonlyArray<LeadershipRecord> = [];

export const APPROVED_PARTNER_RECORDS: ReadonlyArray<PartnerRecord> = [];

export const VERIFIED_ORGANIZING_PARTNERS: ReadonlyArray<PartnerOrganization> = [
  {
    id: 'aishwarya-sarvahith-foundation',
    name: 'Aishwarya Sarvahith Foundation (ASF)',
    tier: 'institutional',
    logoSrc: null,
    websiteUrl: 'https://bhagavadgitavishwamahotsav.com/about/organising-body',
    status: 'confirmed',
  },
  {
    id: 'sree-media',
    name: 'Sree Media',
    tier: 'media',
    logoSrc: null,
    websiteUrl: 'https://bhagavadgitavishwamahotsav.com/',
    status: 'confirmed',
  },
];

export type MediaCategory = 'all' | 'photographs' | 'videos' | 'press' | 'announcements';

export interface MediaRecord {
  id: string;
  category: Exclude<MediaCategory, 'all'>;
  titleKey: string;
  captionKey: string;
  dateLabelKey: string;
  imageSrc: string | null;
  aspectRatio: '16:9' | '4:3';
  status: 'visual-study' | 'approved-official';
}

export interface EternalQuoteRecord {
  quote: string;
  citation: string;
  approved: boolean;
}

/**
 * Maintained strictly null on the editorial Chapter/Home reserve per approval rules;
 * canonical Bhagavad Gita verses live with explicit source metadata in scriptureContent.ts.
 */
export const APPROVED_ETERNAL_QUOTE: EternalQuoteRecord | null = null;

export const STATIC_PARTICIPANT_STATEMENT = '50,000+';
